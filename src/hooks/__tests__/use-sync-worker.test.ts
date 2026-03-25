/**
 * Tests for useSyncWorker hook
 * Integration tests focusing on functionality rather than React internals
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSyncWorker } from '../use-sync-worker';
import { SyncEntryTableRow } from '@/types/sync';

// Mock Worker API
const mockWorker = {
  postMessage: vi.fn(),
  terminate: vi.fn(),
  onmessage: null as ((event: MessageEvent) => void) | null,
  onerror: null as ((error: ErrorEvent) => void) | null,
  onmessageerror: null as ((error: MessageEvent) => void) | null,
};

// Mock Worker constructor using pattern from user memory
class MockWorker {
  static instances: MockWorker[] = [];
  postMessage = vi.fn();
  terminate = vi.fn();
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((error: ErrorEvent) => void) | null = null;
  onmessageerror: ((error: MessageEvent) => void) | null = null;

  constructor(url: string | URL, options?: WorkerOptions) {
    MockWorker.instances.push(this);
  }

  // Helper method to simulate worker messages
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent);
    }
  }

  // Helper method to simulate worker errors
  simulateError(error: string) {
    if (this.onerror) {
      this.onerror(new ErrorEvent('error', { message: error }));
    }
  }

  // Helper method to simulate message errors
  simulateMessageError() {
    if (this.onmessageerror) {
      this.onmessageerror(new MessageEvent('messageerror'));
    }
  }

  static reset() {
    MockWorker.instances = [];
  }
}

// Mock FileSystemDirectoryHandle
const createMockDirectoryHandle = (name: string = 'mock-directory') => ({
  kind: 'directory' as const,
  name,
  getDirectoryHandle: vi.fn(),
  getFileHandle: vi.fn(),
  removeEntry: vi.fn(),
  resolve: vi.fn(),
  values: vi.fn(),
  keys: vi.fn(),
  entries: vi.fn(),
  isSameEntry: vi.fn(),
});

// Mock SyncEntryTableRow
const createMockSyncEntry = (file: string): SyncEntryTableRow => ({
  file,
  status: 'pending',
  source: 'local',
  target: 'remote',
});

describe('useSyncWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockWorker.reset();

    // Set up Worker mock - ensure it's called correctly
    globalThis.Worker = MockWorker as any;

    // Mock URL constructor to always return a valid URL-like object
    globalThis.URL = vi.fn().mockImplementation((url, base) => ({
      href: `${base}/${url}`,
      toString: () => `${base}/${url}`,
    })) as any;

    // Ensure import.meta is properly mocked
    vi.stubGlobal('import', {
      meta: {
        url: 'file:///test/hooks/use-sync-worker.test.ts',
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up any remaining instances
    MockWorker.reset();
  });

  describe('Worker Initialization', () => {
    it('should initialize worker and set ready state', async () => {
      const { result } = renderHook(() => useSyncWorker());

      expect(typeof result.current.listLocalFiles).toBe('function');
      expect(typeof result.current.listRemoteFiles).toBe('function');
      expect(typeof result.current.listBothFiles).toBe('function');
      expect(typeof result.current.syncFiles).toBe('function');

      // Initially should be false
      expect(result.current.isWorkerReady).toBe(false);

      // Wait for the useEffect to complete and worker to be ready
      await waitFor(
        () => {
          expect(result.current.isWorkerReady).toBe(true);
        },
        { timeout: 3000 },
      );

      // Now check that worker was created
      expect(MockWorker.instances).toHaveLength(1);
    });

    it('should handle worker initialization failure', async () => {
      // Make Worker constructor throw
      globalThis.Worker = vi.fn().mockImplementation(() => {
        throw new Error('Worker initialization failed');
      }) as any;

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useSyncWorker());

      // When worker fails to initialize, isWorkerReady should be false
      expect(result.current.isWorkerReady).toBe(false);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize worker:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should correctly set worker event handlers', async () => {
      const { result } = renderHook(() => useSyncWorker());

      // Wait for the useEffect to complete and worker to be ready
      await waitFor(() => {
        expect(result.current.isWorkerReady).toBe(true);
      });

      const worker = MockWorker.instances[0];
      expect(worker.onmessage).toBeDefined();
      expect(worker.onerror).toBeDefined();
      expect(worker.onmessageerror).toBeDefined();
    });
  });

  describe('Worker Lifecycle', () => {
    it('should handle worker error events', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useSyncWorker());

      // Wait for worker to be ready
      await waitFor(() => {
        expect(result.current.isWorkerReady).toBe(true);
      });

      const worker = MockWorker.instances[0];
      worker.simulateError('Worker crashed');

      expect(consoleSpy).toHaveBeenCalledWith('Worker error:', expect.any(ErrorEvent));
      consoleSpy.mockRestore();
    });

    it('should handle worker message errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useSyncWorker());

      // Wait for worker to be ready
      await waitFor(() => {
        expect(result.current.isWorkerReady).toBe(true);
      });

      const worker = MockWorker.instances[0];
      worker.simulateMessageError();

      expect(consoleSpy).toHaveBeenCalledWith('Worker message error:', expect.any(MessageEvent));
      consoleSpy.mockRestore();
    });
  });

  describe('listLocalFiles', () => {
    it('should successfully list local files', async () => {
      const { result } = renderHook(() => useSyncWorker());

      // Wait for worker to be ready
      await waitFor(() => {
        expect(result.current.isWorkerReady).toBe(true);
      });

      const mockHandle = createMockDirectoryHandle();
      const expectedFiles = ['/file1.txt', '/file2.txt'];

      const promise = result.current.listLocalFiles(mockHandle);

      const worker = MockWorker.instances[0];
      expect(worker.postMessage).toHaveBeenCalledWith({
        type: 'LIST_FILES_LOCAL',
        localHandle: mockHandle,
      });

      // Simulate worker response
      setTimeout(() => {
        worker.simulateMessage({
          type: 'FILES_LISTED_LOCAL',
          files: expectedFiles,
        });
      }, 0);

      const result_files = await promise;
      expect(result_files).toEqual(expectedFiles);
    });

    it('should reject when worker is not ready', async () => {
      // Initialize with failing worker
      globalThis.Worker = vi.fn().mockImplementation(() => {
        throw new Error('Worker failed');
      }) as any;

      const { result } = renderHook(() => useSyncWorker());
      const mockHandle = createMockDirectoryHandle();

      await expect(result.current.listLocalFiles(mockHandle)).rejects.toThrow('Worker is not ready');
    });

    it('should handle worker timeout', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useSyncWorker());

      // Wait for worker to be ready
      await waitFor(() => {
        expect(result.current.isWorkerReady).toBe(true);
      });

      const mockHandle = createMockDirectoryHandle();
      const promise = result.current.listLocalFiles(mockHandle);

      // Fast forward past timeout
      vi.advanceTimersByTime(30001);

      await expect(promise).rejects.toThrow('Worker operation LIST_FILES_LOCAL timed out');

      vi.useRealTimers();
    });
  });

  describe('listRemoteFiles', () => {
    it('should successfully list remote files', async () => {
      const { result } = renderHook(() => useSyncWorker());

      // Wait for worker to be ready
      await waitFor(() => {
        expect(result.current.isWorkerReady).toBe(true);
      });

      const mockHandle = createMockDirectoryHandle();
      const expectedFiles = ['/remote1.txt', '/remote2.txt'];

      const promise = result.current.listRemoteFiles(mockHandle);

      const worker = MockWorker.instances[0];
      expect(worker.postMessage).toHaveBeenCalledWith({
        type: 'LIST_FILES_REMOTE',
        remoteHandle: mockHandle,
      });

      setTimeout(() => {
        worker.simulateMessage({
          type: 'FILES_LISTED_REMOTE',
          files: expectedFiles,
        });
      }, 0);

      const result_files = await promise;
      expect(result_files).toEqual(expectedFiles);
    });
  });

  describe('listBothFiles', () => {
    it('should successfully list both local and remote files', async () => {
      const { result } = renderHook(() => useSyncWorker());

      // Wait for worker to be ready
      await waitFor(() => {
        expect(result.current.isWorkerReady).toBe(true);
      });

      const localHandle = createMockDirectoryHandle('local');
      const remoteHandle = createMockDirectoryHandle('remote');
      const expectedResult = {
        localFiles: ['/local1.txt', '/local2.txt'],
        remoteFiles: ['/remote1.txt', '/remote2.txt'],
      };

      const promise = result.current.listBothFiles(localHandle, remoteHandle);

      const worker = MockWorker.instances[0];
      expect(worker.postMessage).toHaveBeenCalledWith({
        type: 'LIST_FILES_BOTH',
        localHandle,
        remoteHandle,
      });

      setTimeout(() => {
        worker.simulateMessage({
          type: 'FILES_LISTED_BOTH',
          localFiles: expectedResult.localFiles,
          remoteFiles: expectedResult.remoteFiles,
        });
      }, 0);

      const result_files = await promise;
      expect(result_files).toEqual(expectedResult);
    });
  });

  describe('syncFiles', () => {
    it('should successfully sync files', async () => {
      const { result } = renderHook(() => useSyncWorker());

      // Wait for worker to be ready
      await waitFor(() => {
        expect(result.current.isWorkerReady).toBe(true);
      });

      const rows = [createMockSyncEntry('/file1.txt'), createMockSyncEntry('/file2.txt')];
      const sourceHandle = createMockDirectoryHandle('source');
      const targetHandle = createMockDirectoryHandle('target');
      const direction = 'to_remote';
      const expectedSyncedFiles = ['/file1.txt', '/file2.txt'];

      const promise = result.current.syncFiles(rows, sourceHandle, targetHandle, direction);

      const worker = MockWorker.instances[0];
      expect(worker.postMessage).toHaveBeenCalledWith({
        type: 'SYNC_FILES',
        rows,
        sourceHandle,
        targetHandle,
        direction,
      });

      setTimeout(() => {
        worker.simulateMessage({
          type: 'FILES_SYNCED',
          syncedFiles: expectedSyncedFiles,
          direction,
        });
      }, 0);

      const result_files = await promise;
      expect(result_files).toEqual(expectedSyncedFiles);
    });
  });

  describe('Error Handling', () => {
    it('should handle worker error responses', async () => {
      const { result } = renderHook(() => useSyncWorker());

      // Wait for worker to be ready
      await waitFor(() => {
        expect(result.current.isWorkerReady).toBe(true);
      });

      const mockHandle = createMockDirectoryHandle();
      const promise = result.current.listLocalFiles(mockHandle);

      const worker = MockWorker.instances[0];
      setTimeout(() => {
        worker.simulateMessage({
          type: 'ERROR',
          message: 'File access denied',
          operation: 'LIST_FILES_LOCAL',
        });
      }, 0);

      await expect(promise).rejects.toThrow('File access denied');
    });

    it('should log error when no handler exists for error response', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useSyncWorker());

      // Wait for worker to be ready
      await waitFor(() => {
        expect(result.current.isWorkerReady).toBe(true);
      });

      const worker = MockWorker.instances[0];
      worker.simulateMessage({
        type: 'ERROR',
        message: 'Unknown error',
        operation: 'UNKNOWN_OPERATION',
      });

      expect(consoleSpy).toHaveBeenCalledWith('Worker error for operation UNKNOWN_OPERATION:', 'Unknown error');

      consoleSpy.mockRestore();
    });

    it('should handle multiple concurrent operations', async () => {
      const { result } = renderHook(() => useSyncWorker());

      // Wait for worker to be ready
      await waitFor(() => {
        expect(result.current.isWorkerReady).toBe(true);
      });

      const localHandle = createMockDirectoryHandle('local');
      const remoteHandle = createMockDirectoryHandle('remote');

      const localPromise = result.current.listLocalFiles(localHandle);
      const remotePromise = result.current.listRemoteFiles(remoteHandle);

      const worker = MockWorker.instances[0];

      // Respond to both operations
      setTimeout(() => {
        worker.simulateMessage({
          type: 'FILES_LISTED_LOCAL',
          files: ['/local.txt'],
        });
        worker.simulateMessage({
          type: 'FILES_LISTED_REMOTE',
          files: ['/remote.txt'],
        });
      }, 0);

      const [localFiles, remoteFiles] = await Promise.all([localPromise, remotePromise]);

      expect(localFiles).toEqual(['/local.txt']);
      expect(remoteFiles).toEqual(['/remote.txt']);
    });

    it('should cleanup message handlers on timeout', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useSyncWorker());

      // Wait for worker to be ready
      await waitFor(() => {
        expect(result.current.isWorkerReady).toBe(true);
      });

      const mockHandle = createMockDirectoryHandle();
      const promise = result.current.listLocalFiles(mockHandle);

      // Fast forward past timeout
      vi.advanceTimersByTime(30001);

      try {
        await promise;
      } catch {
        // Expected to timeout
      }

      // Try another operation - should work normally
      const newPromise = result.current.listLocalFiles(mockHandle);
      const worker = MockWorker.instances[0];

      setTimeout(() => {
        worker.simulateMessage({
          type: 'FILES_LISTED_LOCAL',
          files: ['/new-file.txt'],
        });
      }, 0);

      vi.runOnlyPendingTimers();
      const files = await newPromise;
      expect(files).toEqual(['/new-file.txt']);

      vi.useRealTimers();
    });
  });
});
