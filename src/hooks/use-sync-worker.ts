/**
 * Custom hook for managing the file sync web worker
 * Provides a clean API for interacting with the worker and manages its lifecycle
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { SyncEntryTableRow } from '@/types/sync';

type WorkerMessage =
  | { type: 'LIST_FILES_LOCAL'; localHandle: FileSystemDirectoryHandle }
  | { type: 'LIST_FILES_REMOTE'; remoteHandle: FileSystemDirectoryHandle }
  | { type: 'LIST_FILES_BOTH'; localHandle: FileSystemDirectoryHandle; remoteHandle: FileSystemDirectoryHandle }
  | {
      type: 'SYNC_FILES';
      rows: SyncEntryTableRow[];
      sourceHandle: FileSystemDirectoryHandle;
      targetHandle: FileSystemDirectoryHandle;
      direction: 'to_remote' | 'from_remote';
    };

type WorkerResponse =
  | { type: 'FILES_LISTED_LOCAL'; files: string[] }
  | { type: 'FILES_LISTED_REMOTE'; files: string[] }
  | { type: 'FILES_LISTED_BOTH'; localFiles: string[]; remoteFiles: string[] }
  | { type: 'FILES_SYNCED'; syncedFiles: string[]; direction: 'to_remote' | 'from_remote' }
  | { type: 'ERROR'; message: string; operation: string };

interface UseSyncWorkerReturn {
  listLocalFiles: (handle: FileSystemDirectoryHandle) => Promise<string[]>;
  listRemoteFiles: (handle: FileSystemDirectoryHandle) => Promise<string[]>;
  listBothFiles: (
    localHandle: FileSystemDirectoryHandle,
    remoteHandle: FileSystemDirectoryHandle,
  ) => Promise<{ localFiles: string[]; remoteFiles: string[] }>;
  syncFiles: (
    rows: SyncEntryTableRow[],
    sourceHandle: FileSystemDirectoryHandle,
    targetHandle: FileSystemDirectoryHandle,
    direction: 'to_remote' | 'from_remote',
  ) => Promise<string[]>;
  isWorkerReady: boolean;
}

export function useSyncWorker(): UseSyncWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const messageHandlers = useRef<Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }>>(
    new Map(),
  );

  // Initialize worker
  useEffect(() => {
    try {
      workerRef.current = new Worker(new URL('./sync-worker.ts', import.meta.url), { type: 'module' });

      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { data } = event;

        if (data.type === 'ERROR') {
          // Handle errors - reject any pending promises for this operation
          const handler = messageHandlers.current.get(data.operation);
          if (handler) {
            handler.reject(new Error(data.message));
            messageHandlers.current.delete(data.operation);
          } else {
            console.error(`Worker error for operation ${data.operation}:`, data.message);
          }
          return;
        }

        // Handle successful responses
        switch (data.type) {
          case 'FILES_LISTED_LOCAL': {
            const handler = messageHandlers.current.get('LIST_FILES_LOCAL');
            if (handler) {
              handler.resolve(data.files);
              messageHandlers.current.delete('LIST_FILES_LOCAL');
            }
            break;
          }

          case 'FILES_LISTED_REMOTE': {
            const handler = messageHandlers.current.get('LIST_FILES_REMOTE');
            if (handler) {
              handler.resolve(data.files);
              messageHandlers.current.delete('LIST_FILES_REMOTE');
            }
            break;
          }

          case 'FILES_LISTED_BOTH': {
            const handler = messageHandlers.current.get('LIST_FILES_BOTH');
            if (handler) {
              handler.resolve({ localFiles: data.localFiles, remoteFiles: data.remoteFiles });
              messageHandlers.current.delete('LIST_FILES_BOTH');
            }
            break;
          }

          case 'FILES_SYNCED': {
            const handler = messageHandlers.current.get('SYNC_FILES');
            if (handler) {
              handler.resolve(data.syncedFiles);
              messageHandlers.current.delete('SYNC_FILES');
            }
            break;
          }
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        setIsWorkerReady(false);
      };

      workerRef.current.onmessageerror = (error) => {
        console.error('Worker message error:', error);
        setIsWorkerReady(false);
      };

      setIsWorkerReady(true);
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      setIsWorkerReady(false);
    }

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      messageHandlers.current.clear();
      setIsWorkerReady(false);
    };
  }, []);

  // Generic function to send messages to worker
  const sendMessage = useCallback(
    <T>(message: WorkerMessage): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current || !isWorkerReady) {
          console.error('Worker not ready when trying to send message:', message.type);
          reject(new Error('Worker is not ready'));
          return;
        }

        // Store the promise handlers
        messageHandlers.current.set(message.type, { resolve, reject });

        // Send message to worker
        workerRef.current.postMessage(message);

        // Set a timeout to avoid hanging promises
        setTimeout(() => {
          if (messageHandlers.current.has(message.type)) {
            const handler = messageHandlers.current.get(message.type);
            if (handler) {
              console.error(`Worker operation ${message.type} timed out`);

              handler.reject(new Error(`Worker operation ${message.type} timed out`));
              messageHandlers.current.delete(message.type);
            }
          }
        }, 30000); // 30 second timeout
      });
    },
    [isWorkerReady],
  );

  const listLocalFiles = useCallback(
    (handle: FileSystemDirectoryHandle): Promise<string[]> => {
      return sendMessage<string[]>({ type: 'LIST_FILES_LOCAL', localHandle: handle });
    },
    [sendMessage],
  );

  const listRemoteFiles = useCallback(
    (handle: FileSystemDirectoryHandle): Promise<string[]> => {
      return sendMessage<string[]>({ type: 'LIST_FILES_REMOTE', remoteHandle: handle });
    },
    [sendMessage],
  );

  const listBothFiles = useCallback(
    (
      localHandle: FileSystemDirectoryHandle,
      remoteHandle: FileSystemDirectoryHandle,
    ): Promise<{ localFiles: string[]; remoteFiles: string[] }> => {
      return sendMessage<{ localFiles: string[]; remoteFiles: string[] }>({
        type: 'LIST_FILES_BOTH',
        localHandle,
        remoteHandle,
      });
    },
    [sendMessage],
  );

  const syncFiles = useCallback(
    (
      rows: SyncEntryTableRow[],
      sourceHandle: FileSystemDirectoryHandle,
      targetHandle: FileSystemDirectoryHandle,
      direction: 'to_remote' | 'from_remote',
    ): Promise<string[]> => {
      return sendMessage<string[]>({
        type: 'SYNC_FILES',
        rows,
        sourceHandle,
        targetHandle,
        direction,
      });
    },
    [sendMessage],
  );

  return {
    listLocalFiles,
    listRemoteFiles,
    listBothFiles,
    syncFiles,
    isWorkerReady,
  };
}
