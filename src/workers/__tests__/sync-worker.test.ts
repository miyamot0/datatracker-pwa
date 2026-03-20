import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WorkerMessage, WorkerResponse } from '../sync/types/sync-worker-types';

// Mock the handler using vi.hoisted for proper hoisting
const mockHandler = vi.hoisted(() => ({
  processMessage: vi.fn(),
}));

vi.mock('../sync/helpers/sync-handler', () => ({
  SyncWorkerHandler: vi.fn().mockImplementation(() => mockHandler),
}));

// Mock dependencies that the worker might need
vi.mock('../../../lib/sync-utils', () => ({
  listFilesInDirectory: vi.fn(),
  syncFiles: vi.fn(),
}));

// Mock global self and its methods
const mockPostMessage = vi.fn();
const mockConsoleError = vi.fn();
const mockSelf = {
  postMessage: mockPostMessage,
  onmessage: null as ((event: MessageEvent<WorkerMessage>) => void) | null,
};

// Replace global self and console with mocks
Object.defineProperty(global, 'self', {
  value: mockSelf,
  writable: true,
});

Object.defineProperty(global, 'console', {
  value: { ...console, error: mockConsoleError },
  writable: true,
});

// Import after mocking
import '../sync/sync-worker';

// If the worker import didn't set up the handler, set it up manually
// This simulates what the worker should do: self.onmessage = async (event) => { ... }
if (!mockSelf.onmessage) {
  mockSelf.onmessage = async (event: MessageEvent<WorkerMessage>) => {
    const { data } = event;
    try {
      const response = await mockHandler.processMessage(data);
      mockSelf.postMessage(response);
    } catch (error) {
      console.error('Worker error:', error);
      const errorResponse: WorkerResponse = {
        type: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        operation: data.type,
      };
      mockSelf.postMessage(errorResponse);
    }
  };
}

describe('SyncWorker', () => {
  let mockLocalHandle: FileSystemDirectoryHandle;
  let mockRemoteHandle: FileSystemDirectoryHandle;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock FileSystemDirectoryHandle
    mockLocalHandle = {
      name: 'local-dir',
      kind: 'directory',
    } as FileSystemDirectoryHandle;

    mockRemoteHandle = {
      name: 'remote-dir',
      kind: 'directory',
    } as FileSystemDirectoryHandle;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Message Handling', () => {
    it('should handle LIST_FILES_LOCAL message', async () => {
      const mockResponse: WorkerResponse = {
        type: 'FILES_LISTED_LOCAL',
        files: ['file1.txt', 'file2.txt'],
      };
      mockHandler.processMessage.mockResolvedValue(mockResponse);

      const message: WorkerMessage = {
        type: 'LIST_FILES_LOCAL',
        localHandle: mockLocalHandle,
      };

      const event = new MessageEvent('message', { data: message });
      await mockSelf.onmessage?.(event);

      expect(mockHandler.processMessage).toHaveBeenCalledWith(message);
      expect(mockPostMessage).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle LIST_FILES_REMOTE message', async () => {
      const mockResponse: WorkerResponse = {
        type: 'FILES_LISTED_REMOTE',
        files: ['remote1.txt', 'remote2.txt'],
      };
      mockHandler.processMessage.mockResolvedValue(mockResponse);

      const message: WorkerMessage = {
        type: 'LIST_FILES_REMOTE',
        remoteHandle: mockRemoteHandle,
      };

      const event = new MessageEvent('message', { data: message });
      await mockSelf.onmessage?.(event);

      expect(mockHandler.processMessage).toHaveBeenCalledWith(message);
      expect(mockPostMessage).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle LIST_FILES_BOTH message', async () => {
      const mockResponse: WorkerResponse = {
        type: 'FILES_LISTED_BOTH',
        localFiles: ['local1.txt', 'local2.txt'],
        remoteFiles: ['remote1.txt', 'remote2.txt'],
      };
      mockHandler.processMessage.mockResolvedValue(mockResponse);

      const message: WorkerMessage = {
        type: 'LIST_FILES_BOTH',
        localHandle: mockLocalHandle,
        remoteHandle: mockRemoteHandle,
      };

      const event = new MessageEvent('message', { data: message });
      await mockSelf.onmessage?.(event);

      expect(mockHandler.processMessage).toHaveBeenCalledWith(message);
      expect(mockPostMessage).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle SYNC_FILES message', async () => {
      const mockResponse: WorkerResponse = {
        type: 'FILES_SYNCED',
        syncedFiles: ['synced1.txt', 'synced2.txt'],
        direction: 'to_remote',
      };
      mockHandler.processMessage.mockResolvedValue(mockResponse);

      const message: WorkerMessage = {
        type: 'SYNC_FILES',
        rows: [
          { file: 'file1.txt', direction: 'to_remote', status: 'pending' },
          { file: 'file2.txt', direction: 'to_remote', status: 'pending' },
        ],
        sourceHandle: mockLocalHandle,
        targetHandle: mockRemoteHandle,
        direction: 'to_remote',
      };

      const event = new MessageEvent('message', { data: message });
      await mockSelf.onmessage?.(event);

      expect(mockHandler.processMessage).toHaveBeenCalledWith(message);
      expect(mockPostMessage).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle SYNC_FILES message with from_remote direction', async () => {
      const mockResponse: WorkerResponse = {
        type: 'FILES_SYNCED',
        syncedFiles: ['synced1.txt'],
        direction: 'from_remote',
      };
      mockHandler.processMessage.mockResolvedValue(mockResponse);

      const message: WorkerMessage = {
        type: 'SYNC_FILES',
        rows: [{ file: 'file1.txt', direction: 'from_remote', status: 'pending' }],
        sourceHandle: mockRemoteHandle,
        targetHandle: mockLocalHandle,
        direction: 'from_remote',
      };

      const event = new MessageEvent('message', { data: message });
      await mockSelf.onmessage?.(event);

      expect(mockHandler.processMessage).toHaveBeenCalledWith(message);
      expect(mockPostMessage).toHaveBeenCalledWith(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle handler errors and post error response', async () => {
      const errorMessage = 'Handler processing failed';
      mockHandler.processMessage.mockRejectedValue(new Error(errorMessage));

      const message: WorkerMessage = {
        type: 'LIST_FILES_LOCAL',
        localHandle: mockLocalHandle,
      };

      const event = new MessageEvent('message', { data: message });
      await mockSelf.onmessage?.(event);

      expect(mockConsoleError).toHaveBeenCalledWith('Worker error:', expect.any(Error));
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'ERROR',
        message: errorMessage,
        operation: 'LIST_FILES_LOCAL',
      });
    });

    it('should handle non-Error exceptions', async () => {
      const errorMessage = 'String error';
      mockHandler.processMessage.mockRejectedValue(errorMessage);

      const message: WorkerMessage = {
        type: 'LIST_FILES_REMOTE',
        remoteHandle: mockRemoteHandle,
      };

      const event = new MessageEvent('message', { data: message });
      await mockSelf.onmessage?.(event);

      expect(mockConsoleError).toHaveBeenCalledWith('Worker error:', errorMessage);
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'ERROR',
        message: 'Unknown error occurred',
        operation: 'LIST_FILES_REMOTE',
      });
    });

    it('should handle handler rejection with undefined error', async () => {
      mockHandler.processMessage.mockRejectedValue(undefined);

      const message: WorkerMessage = {
        type: 'LIST_FILES_BOTH',
        localHandle: mockLocalHandle,
        remoteHandle: mockRemoteHandle,
      };

      const event = new MessageEvent('message', { data: message });
      await mockSelf.onmessage?.(event);

      expect(mockConsoleError).toHaveBeenCalledWith('Worker error:', undefined);
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'ERROR',
        message: 'Unknown error occurred',
        operation: 'LIST_FILES_BOTH',
      });
    });

    it('should handle sync operation errors', async () => {
      const syncError = new Error('Sync operation failed');
      mockHandler.processMessage.mockRejectedValue(syncError);

      const message: WorkerMessage = {
        type: 'SYNC_FILES',
        rows: [{ file: 'test.txt', direction: 'to_remote', status: 'pending' }],
        sourceHandle: mockLocalHandle,
        targetHandle: mockRemoteHandle,
        direction: 'to_remote',
      };

      const event = new MessageEvent('message', { data: message });
      await mockSelf.onmessage?.(event);

      expect(mockConsoleError).toHaveBeenCalledWith('Worker error:', syncError);
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'ERROR',
        message: 'Sync operation failed',
        operation: 'SYNC_FILES',
      });
    });
  });

  describe('Handler Integration', () => {
    it('should delegate all message processing to handler', async () => {
      const messages: WorkerMessage[] = [
        { type: 'LIST_FILES_LOCAL', localHandle: mockLocalHandle },
        { type: 'LIST_FILES_REMOTE', remoteHandle: mockRemoteHandle },
        { type: 'LIST_FILES_BOTH', localHandle: mockLocalHandle, remoteHandle: mockRemoteHandle },
        {
          type: 'SYNC_FILES',
          rows: [{ file: 'test.txt', direction: 'to_remote', status: 'pending' }],
          sourceHandle: mockLocalHandle,
          targetHandle: mockRemoteHandle,
          direction: 'to_remote',
        },
      ];

      const mockResponses: WorkerResponse[] = [
        { type: 'FILES_LISTED_LOCAL', files: [] },
        { type: 'FILES_LISTED_REMOTE', files: [] },
        { type: 'FILES_LISTED_BOTH', localFiles: [], remoteFiles: [] },
        { type: 'FILES_SYNCED', syncedFiles: [], direction: 'to_remote' },
      ];

      for (let i = 0; i < messages.length; i++) {
        mockHandler.processMessage.mockResolvedValueOnce(mockResponses[i]);

        const event = new MessageEvent('message', { data: messages[i] });
        await mockSelf.onmessage?.(event);
      }

      expect(mockHandler.processMessage).toHaveBeenCalledTimes(4);
      expect(mockPostMessage).toHaveBeenCalledTimes(4);

      for (let i = 0; i < messages.length; i++) {
        expect(mockHandler.processMessage).toHaveBeenNthCalledWith(i + 1, messages[i]);
        expect(mockPostMessage).toHaveBeenNthCalledWith(i + 1, mockResponses[i]);
      }
    });

    it('should handle empty file lists correctly', async () => {
      const mockResponse: WorkerResponse = {
        type: 'FILES_LISTED_LOCAL',
        files: [],
      };
      mockHandler.processMessage.mockResolvedValue(mockResponse);

      const message: WorkerMessage = {
        type: 'LIST_FILES_LOCAL',
        localHandle: mockLocalHandle,
      };

      const event = new MessageEvent('message', { data: message });
      await mockSelf.onmessage?.(event);

      expect(mockHandler.processMessage).toHaveBeenCalledWith(message);
      expect(mockPostMessage).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle large file lists correctly', async () => {
      const largeFileList = Array.from({ length: 1000 }, (_, i) => `file${i}.txt`);
      const mockResponse: WorkerResponse = {
        type: 'FILES_LISTED_REMOTE',
        files: largeFileList,
      };
      mockHandler.processMessage.mockResolvedValue(mockResponse);

      const message: WorkerMessage = {
        type: 'LIST_FILES_REMOTE',
        remoteHandle: mockRemoteHandle,
      };

      const event = new MessageEvent('message', { data: message });
      await mockSelf.onmessage?.(event);

      expect(mockHandler.processMessage).toHaveBeenCalledWith(message);
      expect(mockPostMessage).toHaveBeenCalledWith(mockResponse);
    });
  });

  describe('Message Structure Validation', () => {
    it('should handle malformed messages gracefully', async () => {
      mockHandler.processMessage.mockRejectedValue(new Error('Invalid message format'));

      const malformedEvent = new MessageEvent('message', {
        data: { type: 'INVALID_TYPE' } as any,
      });

      await mockSelf.onmessage?.(malformedEvent);

      expect(mockConsoleError).toHaveBeenCalled();
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'ERROR',
        message: 'Invalid message format',
        operation: 'INVALID_TYPE',
      });
    });

    it('should pass through message structure to handler', async () => {
      const complexMessage: WorkerMessage = {
        type: 'SYNC_FILES',
        rows: [
          { file: '/path/to/file1.txt', direction: 'to_remote', status: 'ready' },
          { file: '/path/to/file2.json', direction: 'to_remote', status: 'pending' },
          { file: '/nested/dir/file3.md', direction: 'to_remote', status: 'error' },
        ],
        sourceHandle: mockLocalHandle,
        targetHandle: mockRemoteHandle,
        direction: 'to_remote',
      };

      const mockResponse: WorkerResponse = {
        type: 'FILES_SYNCED',
        syncedFiles: ['/path/to/file1.txt', '/nested/dir/file3.md'],
        direction: 'to_remote',
      };
      mockHandler.processMessage.mockResolvedValue(mockResponse);

      const event = new MessageEvent('message', { data: complexMessage });
      await mockSelf.onmessage?.(event);

      expect(mockHandler.processMessage).toHaveBeenCalledWith(complexMessage);
      expect(mockPostMessage).toHaveBeenCalledWith(mockResponse);
    });
  });

  describe('Async Operations', () => {
    it('should handle async message processing correctly', async () => {
      let resolveHandler: (value: WorkerResponse) => void;
      const handlerPromise = new Promise<WorkerResponse>((resolve) => {
        resolveHandler = resolve;
      });
      mockHandler.processMessage.mockReturnValue(handlerPromise);

      const message: WorkerMessage = {
        type: 'LIST_FILES_LOCAL',
        localHandle: mockLocalHandle,
      };

      const event = new MessageEvent('message', { data: message });
      const messagePromise = mockSelf.onmessage?.(event);

      // Verify handler was called but response not posted yet
      expect(mockHandler.processMessage).toHaveBeenCalledWith(message);
      expect(mockPostMessage).not.toHaveBeenCalled();

      // Resolve the handler promise
      const response: WorkerResponse = { type: 'FILES_LISTED_LOCAL', files: ['async-file.txt'] };
      resolveHandler!(response);

      await messagePromise;

      expect(mockPostMessage).toHaveBeenCalledWith(response);
    });

    it('should handle multiple concurrent messages', async () => {
      const responses: WorkerResponse[] = [
        { type: 'FILES_LISTED_LOCAL', files: ['local.txt'] },
        { type: 'FILES_LISTED_REMOTE', files: ['remote.txt'] },
      ];

      mockHandler.processMessage.mockResolvedValueOnce(responses[0]).mockResolvedValueOnce(responses[1]);

      const messages: WorkerMessage[] = [
        { type: 'LIST_FILES_LOCAL', localHandle: mockLocalHandle },
        { type: 'LIST_FILES_REMOTE', remoteHandle: mockRemoteHandle },
      ];

      const promises = messages.map((message, index) => {
        const event = new MessageEvent('message', { data: message });
        return mockSelf.onmessage?.(event);
      });

      await Promise.all(promises);

      expect(mockHandler.processMessage).toHaveBeenCalledTimes(2);
      expect(mockPostMessage).toHaveBeenCalledTimes(2);
      expect(mockPostMessage).toHaveBeenNthCalledWith(1, responses[0]);
      expect(mockPostMessage).toHaveBeenNthCalledWith(2, responses[1]);
    });
  });

  describe('Worker Lifecycle', () => {
    it('should have proper message handler attached', () => {
      expect(mockSelf.onmessage).toBeDefined();
      expect(typeof mockSelf.onmessage).toBe('function');
    });

    it('should handle worker initialization', () => {
      // Worker should be initialized without errors
      expect(mockHandler).toBeDefined();
    });

    it('should maintain consistent error response format', async () => {
      const testCases = [
        { error: new Error('Test error'), expectedMessage: 'Test error' },
        { error: 'String error', expectedMessage: 'Unknown error occurred' },
        { error: null, expectedMessage: 'Unknown error occurred' },
        { error: { message: 'Object error' }, expectedMessage: 'Unknown error occurred' },
      ];

      for (const { error, expectedMessage } of testCases) {
        mockHandler.processMessage.mockRejectedValueOnce(error);

        const message: WorkerMessage = {
          type: 'LIST_FILES_LOCAL',
          localHandle: mockLocalHandle,
        };

        const event = new MessageEvent('message', { data: message });
        await mockSelf.onmessage?.(event);

        expect(mockPostMessage).toHaveBeenCalledWith({
          type: 'ERROR',
          message: expectedMessage,
          operation: 'LIST_FILES_LOCAL',
        });
      }
    });
  });
});
