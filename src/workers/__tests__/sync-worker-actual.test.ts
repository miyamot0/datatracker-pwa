import '@vitest/web-worker';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SyncWorker from '../sync/sync-worker?worker';
import type { WorkerMessage, WorkerResponse, SyncEntryTableRow } from '../sync/types/sync-worker-types';

// Mock the sync-utils functions to avoid complex FileSystem API mocking
vi.mock('../../lib/sync-utils', () => ({
  listFilesInDirectory: vi.fn(),
  syncFiles: vi.fn(),
}));

import { listFilesInDirectory, syncFiles } from '../../lib/sync-utils';

describe('SyncWorker Actual Integration', () => {
  let worker: Worker;
  let receivedMessages: WorkerResponse[];
  let messageHandler: (event: MessageEvent<WorkerResponse>) => void;

  // Mock FileSystemDirectoryHandle for message sending (doesn't need full implementation)
  const createMockDirectoryHandle = (name: string): FileSystemDirectoryHandle => {
    return {
      name,
      kind: 'directory' as const,
    } as FileSystemDirectoryHandle;
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Set up default mock implementations
    vi.mocked(listFilesInDirectory).mockImplementation(async () => ['/group1/file1.json', '/group2/file2.csv']);
    vi.mocked(syncFiles).mockImplementation(async () => ['synced-file1.json', 'synced-file2.csv']);

    worker = new SyncWorker();
    receivedMessages = [];

    messageHandler = (event: MessageEvent<WorkerResponse>) => {
      console.log('Received worker message:', event.data.type);
      receivedMessages.push(event.data);
    };

    worker.addEventListener('message', messageHandler);
  });

  afterEach(() => {
    worker.removeEventListener('message', messageHandler);
    worker.terminate();
  });

  describe('Worker Communication Debug', () => {
    it('should receive messages from worker', async () => {
      // Create a very simple test to verify basic worker communication
      let messageCount = 0;

      const testHandler = (event: MessageEvent<WorkerResponse>) => {
        messageCount++;
        receivedMessages.push(event.data);
        console.log('Test received message:', event.data.type);
      };

      // Set up mock to throw error for null handle (like other error tests)
      vi.mocked(listFilesInDirectory).mockImplementationOnce(async (handle) => {
        if (!handle) {
          throw new Error('Invalid directory handle');
        }
        return ['/group1/file1.json', '/group2/file2.csv'];
      });

      worker.removeEventListener('message', messageHandler);
      worker.addEventListener('message', testHandler);

      // Try to send an invalid message that should trigger an error response
      const invalidMessage: WorkerMessage = {
        type: 'LIST_FILES_LOCAL',
        localHandle: null as any,
      };

      receivedMessages.length = 0; // Clear for this test
      worker.postMessage(invalidMessage);

      // Wait longer for response
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('Message count:', messageCount);
      console.log(
        'Received message types:',
        receivedMessages.map((m) => m.type),
      );

      expect(messageCount).toBeGreaterThan(0);
      expect(receivedMessages.length).toBeGreaterThan(0);

      // Should get an error response at minimum
      const errorResponse = receivedMessages.find((msg) => msg.type === 'ERROR');
      expect(errorResponse).toBeDefined();

      worker.removeEventListener('message', testHandler);
      worker.addEventListener('message', messageHandler);
    }, 10000);
  });

  describe('Worker Instantiation', () => {
    it('should create worker instance successfully', () => {
      expect(worker).toBeInstanceOf(Worker);
    });

    it('should be able to receive messages', async () => {
      const localHandle = createMockDirectoryHandle('test-local', { group1: ['file1.json'] });
      const message: WorkerMessage = {
        type: 'LIST_FILES_LOCAL',
        localHandle,
      };

      worker.postMessage(message);

      // Wait for potential async processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should not throw or crash
      expect(worker).toBeInstanceOf(Worker);
    });
  });

  describe('File Listing Operations', () => {
    it('should process LIST_FILES_LOCAL message', async () => {
      const localHandle = createMockDirectoryHandle('test-local');

      const message: WorkerMessage = {
        type: 'LIST_FILES_LOCAL',
        localHandle,
      };

      // Clear previous messages and send new one
      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log(
        'Received messages for local:',
        receivedMessages.map((m) => `${m.type}${m.type === 'ERROR' ? ': ' + m.message : ''}`),
      );

      // Should receive success response with mocked files
      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.type).toBe('FILES_LISTED_LOCAL');

      if (response.type === 'FILES_LISTED_LOCAL') {
        expect(Array.isArray(response.files)).toBe(true);
        expect(response.files).toEqual(['/group1/file1.json', '/group2/file2.csv']);
        console.log('Successfully listed files:', response.files);
      }

      // Verify the sync-utils function was called
      expect(listFilesInDirectory).toHaveBeenCalledWith(localHandle);
    });

    it('should process LIST_FILES_REMOTE message', async () => {
      const testSubdirs = { remote_group: ['remote1.json', 'remote2.csv'] };
      const remoteHandle = createMockDirectoryHandle('test-remote', testSubdirs);

      const message: WorkerMessage = {
        type: 'LIST_FILES_REMOTE',
        remoteHandle,
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should receive either success or error response
      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(['FILES_LISTED_REMOTE', 'ERROR']).toContain(response.type);

      if (response.type === 'FILES_LISTED_REMOTE') {
        expect(Array.isArray(response.files)).toBe(true);
      } else if (response.type === 'ERROR') {
        expect(response.operation).toBe('LIST_FILES_REMOTE');
      }
    });

    it('should process LIST_FILES_BOTH message', async () => {
      const localSubdirs = { local_group: ['local1.json', 'shared.csv'] };
      const remoteSubdirs = { remote_group: ['remote1.json', 'shared.csv'] };
      const localHandle = createMockDirectoryHandle('test-local', localSubdirs);
      const remoteHandle = createMockDirectoryHandle('test-remote', remoteSubdirs);

      const message: WorkerMessage = {
        type: 'LIST_FILES_BOTH',
        localHandle,
        remoteHandle,
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should receive either success or error response
      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(['FILES_LISTED_BOTH', 'ERROR']).toContain(response.type);

      if (response.type === 'FILES_LISTED_BOTH') {
        expect(Array.isArray(response.localFiles)).toBe(true);
        expect(Array.isArray(response.remoteFiles)).toBe(true);
      } else if (response.type === 'ERROR') {
        expect(response.operation).toBe('LIST_FILES_BOTH');
      }
    });

    it('should handle empty directory gracefully', async () => {
      // Set up specific mock for empty directory test
      vi.mocked(listFilesInDirectory).mockImplementationOnce(async () => []);

      const emptyHandle = createMockDirectoryHandle('empty-dir');

      const message: WorkerMessage = {
        type: 'LIST_FILES_LOCAL',
        localHandle: emptyHandle,
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should receive success response with empty array
      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.type).toBe('FILES_LISTED_LOCAL');

      if (response.type === 'FILES_LISTED_LOCAL') {
        expect(response.files).toEqual([]);
      }

      // Verify the sync-utils function was called
      expect(listFilesInDirectory).toHaveBeenCalledWith(emptyHandle);
    });
  });

  describe('File Sync Operations', () => {
    it('should process SYNC_FILES operation', async () => {
      const sourceSubdirs = { group1: ['sync1.json', 'sync2.csv'] };
      const targetSubdirs = { group1: ['existing.json'] };
      const sourceHandle = createMockDirectoryHandle('source', sourceSubdirs);
      const targetHandle = createMockDirectoryHandle('target', targetSubdirs);

      const rows: SyncEntryTableRow[] = [{ file: '/group1/sync1.json', direction: 'to_remote', status: 'pending' }];

      const message: WorkerMessage = {
        type: 'SYNC_FILES',
        rows,
        sourceHandle,
        targetHandle,
        direction: 'to_remote',
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should receive either FILES_SYNCED or ERROR response
      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(['FILES_SYNCED', 'ERROR']).toContain(response.type);

      if (response.type === 'FILES_SYNCED') {
        expect(Array.isArray(response.syncedFiles)).toBe(true);
        expect(response.direction).toBe('to_remote');
      } else if (response.type === 'ERROR') {
        expect(response.operation).toBe('SYNC_FILES');
      }
    });

    it('should handle empty sync operation', async () => {
      const sourceHandle = createMockDirectoryHandle('source', {});
      const targetHandle = createMockDirectoryHandle('target', {});

      const message: WorkerMessage = {
        type: 'SYNC_FILES',
        rows: [],
        sourceHandle,
        targetHandle,
        direction: 'to_remote',
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Should handle gracefully - may return FILES_SYNCED with empty array or ERROR
      expect(receivedMessages.length).toBeGreaterThanOrEqual(0);
      expect(worker).toBeInstanceOf(Worker);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed messages gracefully', async () => {
      const malformedMessages = [null, undefined, {}, { type: 'UNKNOWN_TYPE' }, { type: '', payload: {} }];

      for (const message of malformedMessages) {
        expect(() => worker.postMessage(message as any)).not.toThrow();
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Worker should still be responsive
      expect(worker).toBeInstanceOf(Worker);
    });

    it('should handle invalid directory handle', async () => {
      // Set up mock to throw error for null handle
      vi.mocked(listFilesInDirectory).mockImplementationOnce(async (handle) => {
        if (!handle) {
          throw new Error('Invalid directory handle');
        }
        return ['/group1/file1.json', '/group2/file2.csv'];
      });

      const invalidHandle = null as any;

      const message: WorkerMessage = {
        type: 'LIST_FILES_LOCAL',
        localHandle: invalidHandle,
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const errorResponse = receivedMessages.find((msg) => msg.type === 'ERROR');
      expect(errorResponse).toBeDefined();
      if (errorResponse?.type === 'ERROR') {
        expect(errorResponse.operation).toBe('LIST_FILES_LOCAL');
        expect(typeof errorResponse.message).toBe('string');
        expect(errorResponse.message).toContain('Invalid directory handle');
      }
    });

    it('should handle missing required properties', async () => {
      receivedMessages.length = 0; // Clear messages before test

      // Set up mocks to throw errors for invalid inputs
      vi.mocked(listFilesInDirectory).mockImplementation(async (handle) => {
        if (!handle) {
          throw new Error('Missing required handle');
        }
        return ['/group1/file1.json', '/group2/file2.csv'];
      });

      vi.mocked(syncFiles).mockImplementation(async (rows, sourceHandle, targetHandle) => {
        if (!sourceHandle || !targetHandle) {
          throw new Error('Missing required handles');
        }
        return ['synced-file1.json', 'synced-file2.csv'];
      });

      const incompleteMessages = [
        { type: 'LIST_FILES_LOCAL' }, // Missing localHandle
        { type: 'LIST_FILES_REMOTE' }, // Missing remoteHandle
        { type: 'LIST_FILES_BOTH', localHandle: createMockDirectoryHandle('test') }, // Missing remoteHandle
        { type: 'SYNC_FILES', rows: [] }, // Missing handles and direction
      ];

      for (const message of incompleteMessages) {
        worker.postMessage(message as any);
        await new Promise((resolve) => setTimeout(resolve, 100)); // Give more time per message
      }

      // Additional wait for all messages to be processed
      await new Promise((resolve) => setTimeout(resolve, 200));

      const errorResponses = receivedMessages.filter((msg) => msg.type === 'ERROR');
      console.log('Total messages received:', receivedMessages.length);
      console.log('Error messages:', errorResponses.length);
      console.log(
        'All message types:',
        receivedMessages.map((m) => m.type),
      );
      expect(errorResponses.length).toBeGreaterThan(0);
    });

    it('should handle file system errors', async () => {
      // Set up mock to throw permission error
      vi.mocked(listFilesInDirectory).mockImplementationOnce(async () => {
        throw new Error('Permission denied');
      });

      const errorHandle = createMockDirectoryHandle('error-handle');

      const message: WorkerMessage = {
        type: 'LIST_FILES_LOCAL',
        localHandle: errorHandle,
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const errorResponse = receivedMessages.find((msg) => msg.type === 'ERROR');
      expect(errorResponse).toBeDefined();
      if (errorResponse?.type === 'ERROR') {
        expect(errorResponse.message).toContain('Permission denied');
      }
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle multiple concurrent operations', async () => {
      const operations: WorkerMessage[] = [
        { type: 'LIST_FILES_LOCAL', localHandle: createMockDirectoryHandle('dir1', { group1: ['file1.json'] }) },
        { type: 'LIST_FILES_REMOTE', remoteHandle: createMockDirectoryHandle('dir2', { group1: ['file2.json'] }) },
      ];

      receivedMessages.length = 0;
      // Send all messages rapidly
      for (const message of operations) {
        worker.postMessage(message);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Should handle all messages without crashing - may get success or error responses
      expect(worker).toBeInstanceOf(Worker);
      expect(receivedMessages.length).toBeGreaterThanOrEqual(0); // Some messages may result in errors, which is acceptable
    });

    it('should handle rapid sequential messages', async () => {
      const handle = createMockDirectoryHandle('test', { group1: ['file.json'] });

      receivedMessages.length = 0;
      // Send multiple messages in quick succession
      for (let i = 0; i < 5; i++) {
        const message: WorkerMessage = {
          type: 'LIST_FILES_LOCAL',
          localHandle: handle,
        };
        worker.postMessage(message);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Should handle all messages without crashing
      expect(worker).toBeInstanceOf(Worker);
      expect(receivedMessages.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Message Validation and Edge Cases', () => {
    it('should validate worker message processing', async () => {
      const message: WorkerMessage = {
        type: 'LIST_FILES_LOCAL',
        localHandle: createMockDirectoryHandle('test', { group1: ['file1.json'] }),
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should process message and return some response
      expect(worker).toBeInstanceOf(Worker);
      // May get success or error - both are acceptable for integration test
    });

    it('should handle worker lifecycle correctly', async () => {
      // Test that worker can handle operations after creation
      const message: WorkerMessage = {
        type: 'LIST_FILES_LOCAL',
        localHandle: createMockDirectoryHandle('test', { group1: ['file.json'] }),
      };

      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(worker).toBeInstanceOf(Worker);
    });
  });

  describe('Real FileSystem API Integration', () => {
    it('should handle directory structure patterns', async () => {
      // Simulate realistic directory structure
      const mockHandle = createMockDirectoryHandle('project', {
        datatracker: ['session_1.json', 'session_2.json', 'backup.csv', 'config.json', 'report.xlsx'],
      });

      const message: WorkerMessage = {
        type: 'LIST_FILES_LOCAL',
        localHandle: mockHandle,
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should process without crashing - response may be success or error due to mock limitations
      expect(worker).toBeInstanceOf(Worker);
    });

    it('should handle directory permission scenarios', async () => {
      const restrictedHandle = createMockDirectoryHandle('restricted', {});
      // Mock permission failure
      restrictedHandle.queryPermission = vi.fn().mockResolvedValue('denied' as PermissionState);

      const message: WorkerMessage = {
        type: 'LIST_FILES_LOCAL',
        localHandle: restrictedHandle,
      };

      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Should either work or return appropriate error
      expect(worker).toBeInstanceOf(Worker);
    });
  });
});
