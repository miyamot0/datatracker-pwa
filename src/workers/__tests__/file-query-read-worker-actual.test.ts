import '@vitest/web-worker';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import FileQueryReadWorker from '../queries/file-query-read-worker?worker';
import type { QueryRequest, QueryResponse, QUERY_TYPES } from '../queries/types/file-query-read-worker-types';

// Mock the query helper functions to avoid complex FileSystem API mocking
vi.mock('../queries/helpers/file-query-read-actions', () => ({
  fetchDirectories: vi.fn(),
  fetchGroups: vi.fn(),
  fetchClients: vi.fn(),
  fetchEvaluations: vi.fn(),
  fetchEvaluationsAll: vi.fn(),
  fetchConditions: vi.fn(),
  fetchKeysets: vi.fn(),
  fetchKeysetsAll: vi.fn(),
  fetchSessionParams: vi.fn(),
  fetchSessionOutcomes: vi.fn(),
}));

import {
  fetchDirectories,
  fetchGroups,
  fetchClients,
  fetchEvaluations,
  fetchEvaluationsAll,
  fetchConditions,
  fetchKeysets,
  fetchKeysetsAll,
  fetchSessionParams,
  fetchSessionOutcomes,
} from '../queries/helpers/file-query-read-actions';

describe('FileQueryReadWorker Actual Integration', () => {
  let worker: Worker;
  let receivedMessages: QueryResponse[];
  let messageHandler: (event: MessageEvent<QueryResponse>) => void;

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
    vi.mocked(fetchDirectories).mockImplementation(async () => ['dir1', 'dir2', 'dir3']);
    vi.mocked(fetchGroups).mockImplementation(async () => ['group1', 'group2']);
    vi.mocked(fetchClients).mockImplementation(async () => ['client1', 'client2']);
    vi.mocked(fetchEvaluations).mockImplementation(async () => ['evaluation1', 'evaluation2']);
    vi.mocked(fetchEvaluationsAll).mockImplementation(async () => [
      { groupName: 'group1', clientName: 'client1', evaluationName: 'eval1' },
      { groupName: 'group1', clientName: 'client2', evaluationName: 'eval2' },
    ]);
    vi.mocked(fetchConditions).mockImplementation(async () => ['condition1', 'condition2']);
    vi.mocked(fetchKeysets).mockImplementation(async () => [
      { id: '1', name: 'keyset1', keys: [] },
      { id: '2', name: 'keyset2', keys: [] },
    ]);
    vi.mocked(fetchKeysetsAll).mockImplementation(async () => [
      { id: '1', name: 'keyset1', keys: [], extended: true },
      { id: '2', name: 'keyset2', keys: [], extended: false },
    ]);
    vi.mocked(fetchSessionParams).mockImplementation(async () => ({
      param1: 'value1',
      param2: 'value2',
    }));
    vi.mocked(fetchSessionOutcomes).mockImplementation(async () => [
      { sessionId: '1', outcome: 'success' },
      { sessionId: '2', outcome: 'partial' },
    ]);

    worker = new FileQueryReadWorker();
    receivedMessages = [];

    messageHandler = (event: MessageEvent<QueryResponse>) => {
      console.log('Received worker message:', event.data.success ? 'SUCCESS' : 'ERROR');
      receivedMessages.push(event.data);
    };

    worker.addEventListener('message', messageHandler);
  });

  afterEach(() => {
    worker.removeEventListener('message', messageHandler);
    worker.terminate();
  });

  describe('Worker Instantiation', () => {
    it('should create worker instance successfully', () => {
      expect(worker).toBeInstanceOf(Worker);
    });

    it('should be able to receive messages', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: QueryRequest = {
        id: 'test-message',
        type: 'FETCH_GROUPS',
        handle: testHandle,
      };

      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedMessages.length).toBeGreaterThan(0);
      expect(worker).toBeInstanceOf(Worker);
    });
  });

  describe('Query Operations', () => {
    it('should process FETCH_GROUPS message', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: QueryRequest = {
        id: 'test-groups',
        type: 'FETCH_GROUPS',
        handle: testHandle,
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-groups');
      expect(response.success).toBe(true);

      if (response.success) {
        expect(response.data).toEqual(['group1', 'group2']);
        expect(typeof response.executionTime).toBe('number');
        expect(typeof response.timestamp).toBe('number');
      }

      // Verify the query function was called
      expect(fetchGroups).toHaveBeenCalledWith(testHandle);
    });

    it('should process FETCH_CLIENTS message', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: QueryRequest = {
        id: 'test-clients',
        type: 'FETCH_CLIENTS',
        handle: testHandle,
        groupName: 'test-group',
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-clients');
      expect(response.success).toBe(true);

      if (response.success) {
        expect(response.data).toEqual(['client1', 'client2']);
      }

      // Verify the query function was called with correct parameters
      expect(fetchClients).toHaveBeenCalledWith(testHandle, 'test-group');
    });

    it('should process FETCH_EVALUATIONS message', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: QueryRequest = {
        id: 'test-evaluations',
        type: 'FETCH_EVALUATIONS',
        handle: testHandle,
        groupName: 'test-group',
        clientName: 'test-client',
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-evaluations');
      expect(response.success).toBe(true);

      if (response.success) {
        expect(response.data).toEqual(['evaluation1', 'evaluation2']);
      }

      // Verify the query function was called
      expect(fetchEvaluations).toHaveBeenCalledWith(testHandle, 'test-group', 'test-client');
    });

    it('should process FETCH_EVALUATIONS_ALL message', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: QueryRequest = {
        id: 'test-evaluations-all',
        type: 'FETCH_EVALUATIONS_ALL',
        handle: testHandle,
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-evaluations-all');
      expect(response.success).toBe(true);

      if (response.success) {
        expect(response.data).toEqual([
          { groupName: 'group1', clientName: 'client1', evaluationName: 'eval1' },
          { groupName: 'group1', clientName: 'client2', evaluationName: 'eval2' },
        ]);
      }

      // Verify the query function was called
      expect(fetchEvaluationsAll).toHaveBeenCalledWith(testHandle);
    });

    it('should process FETCH_CONDITIONS message', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: QueryRequest = {
        id: 'test-conditions',
        type: 'FETCH_CONDITIONS',
        handle: testHandle,
        groupName: 'test-group',
        individualName: 'test-individual',
        evaluationName: 'test-evaluation',
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-conditions');
      expect(response.success).toBe(true);

      if (response.success) {
        expect(response.data).toEqual(['condition1', 'condition2']);
      }

      // Verify the query function was called
      expect(fetchConditions).toHaveBeenCalledWith(testHandle, 'test-group', 'test-individual', 'test-evaluation');
    });

    it('should process FETCH_KEYSETS message', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: QueryRequest = {
        id: 'test-keysets',
        type: 'FETCH_KEYSETS',
        handle: testHandle,
        groupName: 'test-group',
        individualName: 'test-individual',
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-keysets');
      expect(response.success).toBe(true);

      if (response.success) {
        expect(response.data).toEqual([
          { id: '1', name: 'keyset1', keys: [] },
          { id: '2', name: 'keyset2', keys: [] },
        ]);
      }

      // Verify the query function was called
      expect(fetchKeysets).toHaveBeenCalledWith(testHandle, 'test-group', 'test-individual');
    });

    it('should process FETCH_KEYSETS_ALL message', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: QueryRequest = {
        id: 'test-keysets-all',
        type: 'FETCH_KEYSETS_ALL',
        handle: testHandle,
        groupName: 'test-group',
        individualName: 'test-individual',
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-keysets-all');
      expect(response.success).toBe(true);

      if (response.success) {
        expect(response.data).toEqual([
          { id: '1', name: 'keyset1', keys: [], extended: true },
          { id: '2', name: 'keyset2', keys: [], extended: false },
        ]);
      }

      // Verify the query function was called
      expect(fetchKeysetsAll).toHaveBeenCalledWith(testHandle, 'test-group', 'test-individual');
    });

    it('should process FETCH_SESSION_PARAMS message', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: QueryRequest = {
        id: 'test-session-params',
        type: 'FETCH_SESSION_PARAMS',
        handle: testHandle,
        groupName: 'test-group',
        individualName: 'test-individual',
        evaluationName: 'test-evaluation',
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-session-params');
      expect(response.success).toBe(true);

      if (response.success) {
        expect(response.data).toEqual({
          param1: 'value1',
          param2: 'value2',
        });
      }

      // Verify the query function was called
      expect(fetchSessionParams).toHaveBeenCalledWith(testHandle, 'test-group', 'test-individual', 'test-evaluation');
    });

    it('should process FETCH_OUTCOMES message', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: QueryRequest = {
        id: 'test-outcomes',
        type: 'FETCH_OUTCOMES',
        handle: testHandle,
        groupName: 'test-group',
        individualName: 'test-individual',
        evaluationName: 'test-evaluation',
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-outcomes');
      expect(response.success).toBe(true);

      if (response.success) {
        expect(response.data).toEqual([
          { sessionId: '1', outcome: 'success' },
          { sessionId: '2', outcome: 'partial' },
        ]);
      }

      // Verify the query function was called
      expect(fetchSessionOutcomes).toHaveBeenCalledWith(testHandle, 'test-group', 'test-individual', 'test-evaluation');
    });

    it('should process FETCH_DIRECTORIES message', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: QueryRequest = {
        id: 'test-directories',
        type: 'FETCH_DIRECTORIES',
        handle: testHandle,
        path: ['level1', 'level2'],
        filterPattern: /test-*/,
        excludeSystemFiles: true,
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-directories');
      expect(response.success).toBe(true);

      if (response.success) {
        expect(response.data).toEqual(['dir1', 'dir2', 'dir3']);
      }

      // Verify the query function was called with correct options
      expect(fetchDirectories).toHaveBeenCalledWith(testHandle, {
        path: ['level1', 'level2'],
        filterPattern: /test-*/,
        excludeSystemFiles: true,
      });
    });

    it('should process FETCH_SESSIONS message (mapped to directories)', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: QueryRequest = {
        id: 'test-sessions',
        type: 'FETCH_SESSIONS',
        handle: testHandle,
        path: ['sessions'],
        excludeSystemFiles: false,
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-sessions');
      expect(response.success).toBe(true);

      if (response.success) {
        expect(response.data).toEqual(['dir1', 'dir2', 'dir3']);
      }

      // Verify FETCH_SESSIONS is mapped to fetchDirectories
      expect(fetchDirectories).toHaveBeenCalledWith(testHandle, {
        path: ['sessions'],
        filterPattern: undefined,
        excludeSystemFiles: false,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed messages gracefully', async () => {
      const malformedMessages = [
        null,
        undefined,
        {},
        { id: 'test' }, // Missing type
        { type: 'FETCH_GROUPS' }, // Missing id
        { id: '', type: 'FETCH_GROUPS' }, // Empty id
      ];

      receivedMessages.length = 0;

      for (const message of malformedMessages) {
        expect(() => worker.postMessage(message as any)).not.toThrow();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Wait for all messages to be processed
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Should receive error responses for invalid messages
      const errorResponses = receivedMessages.filter((msg) => !msg.success);
      expect(errorResponses.length).toBeGreaterThan(0);

      // Check that the error responses have expected structure
      errorResponses.forEach((response) => {
        expect(response.success).toBe(false);
        expect('error' in response).toBe(true);
        expect(typeof response.executionTime).toBe('number');
        expect(typeof response.timestamp).toBe('number');
      });

      // Worker should still be responsive
      expect(worker).toBeInstanceOf(Worker);
    });

    it('should handle unknown query type', async () => {
      const message: QueryRequest = {
        id: 'test-unknown',
        type: 'UNKNOWN_QUERY_TYPE' as any,
        handle: createMockDirectoryHandle('test'),
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.success).toBe(false);
      expect(response.id).toBe('test-unknown');

      if (!response.success) {
        expect(response.error).toContain('Unsupported query type');
      }
    });

    it('should handle query function errors', async () => {
      // Set up mock to throw error
      vi.mocked(fetchGroups).mockImplementationOnce(async () => {
        throw new Error('Query operation failed');
      });

      const testHandle = createMockDirectoryHandle('test-handle');

      const message: QueryRequest = {
        id: 'test-error',
        type: 'FETCH_GROUPS',
        handle: testHandle,
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const errorResponse = receivedMessages.find((msg) => !msg.success);
      expect(errorResponse).toBeDefined();

      if (errorResponse && !errorResponse.success) {
        expect(errorResponse.id).toBe('test-error');
        expect(errorResponse.error).toContain('Query operation failed');
        expect(typeof errorResponse.executionTime).toBe('number');
        expect(typeof errorResponse.timestamp).toBe('number');
      }
    });

    it('should handle FileSystem API errors', async () => {
      // Set up mock to throw FileSystem-specific error
      vi.mocked(fetchClients).mockImplementationOnce(async () => {
        throw new Error('The requested file could not be read, typically due to permission problems');
      });

      const testHandle = createMockDirectoryHandle('test-handle');

      const message: QueryRequest = {
        id: 'test-filesystem-error',
        type: 'FETCH_CLIENTS',
        handle: testHandle,
        groupName: 'test-group',
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const errorResponse = receivedMessages.find((msg) => !msg.success);
      expect(errorResponse).toBeDefined();

      if (errorResponse && !errorResponse.success) {
        expect(errorResponse.id).toBe('test-filesystem-error');
        expect(errorResponse.error).toContain('permission problems');
      }
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle multiple concurrent operations', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');
      const messages: QueryRequest[] = [
        {
          id: 'concurrent-1',
          type: 'FETCH_GROUPS',
          handle: testHandle,
        },
        {
          id: 'concurrent-2',
          type: 'FETCH_CLIENTS',
          handle: testHandle,
          groupName: 'group1',
        },
        {
          id: 'concurrent-3',
          type: 'FETCH_EVALUATIONS',
          handle: testHandle,
          groupName: 'group1',
          clientName: 'client1',
        },
      ];

      receivedMessages.length = 0;

      // Send all messages concurrently
      messages.forEach((message) => worker.postMessage(message));

      // Wait for all responses
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should receive responses for all messages
      expect(receivedMessages.length).toBe(messages.length);

      // Check that all message IDs are present in responses
      const responseIds = receivedMessages.map((r) => r.id);
      messages.forEach((msg) => {
        expect(responseIds).toContain(msg.id);
      });
    });

    it('should handle rapid sequential messages', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      receivedMessages.length = 0;

      // Send messages rapidly in sequence
      for (let i = 0; i < 5; i++) {
        const message: QueryRequest = {
          id: `rapid-${i}`,
          type: 'FETCH_GROUPS',
          handle: testHandle,
        };

        worker.postMessage(message);
        await new Promise((resolve) => setTimeout(resolve, 10)); // Very short delay
      }

      // Wait for all responses
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(receivedMessages.length).toBe(5);

      // Verify all expected IDs are present
      const expectedIds = Array.from({ length: 5 }, (_, i) => `rapid-${i}`);
      const receivedIds = receivedMessages.map((r) => r.id);

      expectedIds.forEach((id) => {
        expect(receivedIds).toContain(id);
      });
    });

    it('should provide accurate execution timing', async () => {
      // Set up mock with artificial delay
      vi.mocked(fetchGroups).mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return ['delayed-group1', 'delayed-group2'];
      });

      const testHandle = createMockDirectoryHandle('test-handle');

      const message: QueryRequest = {
        id: 'timing-test',
        type: 'FETCH_GROUPS',
        handle: testHandle,
      };

      const startTime = Date.now();
      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('timing-test');

      // Execution time should be at least the artificial delay
      expect(response.executionTime).toBeGreaterThanOrEqual(90); // Allow some tolerance

      // Timestamp should be recent
      const endTime = Date.now();
      expect(response.timestamp).toBeGreaterThanOrEqual(startTime);
      expect(response.timestamp).toBeLessThanOrEqual(endTime);
    });
  });

  describe('Message Validation and Edge Cases', () => {
    it('should validate worker message processing', async () => {
      const testHandle = createMockDirectoryHandle('validation-test');

      const validMessage: QueryRequest = {
        id: 'validation-test',
        type: 'FETCH_GROUPS',
        handle: testHandle,
      };

      receivedMessages.length = 0;
      worker.postMessage(validMessage);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBe(1);

      const response = receivedMessages[0];

      // Validate response structure
      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('timestamp');
      expect(response).toHaveProperty('executionTime');

      if (response.success) {
        expect(response).toHaveProperty('data');
      } else {
        expect(response).toHaveProperty('error');
      }
    });

    it('should handle worker lifecycle correctly', async () => {
      expect(worker).toBeInstanceOf(Worker);

      // Send a message to ensure worker is responsive
      const testHandle = createMockDirectoryHandle('lifecycle-test');
      const message: QueryRequest = {
        id: 'lifecycle-test',
        type: 'FETCH_GROUPS',
        handle: testHandle,
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(receivedMessages.length).toBeGreaterThan(0);

      // Worker should still be functional after processing
      expect(worker).toBeInstanceOf(Worker);
    });
  });

  describe('Real FileSystem API Integration Patterns', () => {
    it('should handle complex query request patterns', async () => {
      const testHandle = createMockDirectoryHandle('complex-test');

      // Test complex directory fetch with multiple options
      const message: QueryRequest = {
        id: 'complex-directories',
        type: 'FETCH_DIRECTORIES',
        handle: testHandle,
        path: ['deep', 'nested', 'structure'],
        filterPattern: /session-\d{8}-\d{6}/,
        excludeSystemFiles: false,
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('complex-directories');
      expect(response.success).toBe(true);

      // Verify all parameters were passed correctly
      expect(fetchDirectories).toHaveBeenCalledWith(testHandle, {
        path: ['deep', 'nested', 'structure'],
        filterPattern: /session-\d{8}-\d{6}/,
        excludeSystemFiles: false,
      });
    });

    it('should handle directory handle edge cases', async () => {
      // Test with different directory handle scenarios
      const scenarios = [
        { name: 'empty-name', handle: createMockDirectoryHandle('') },
        { name: 'special-chars', handle: createMockDirectoryHandle('test-dir-@#$%') },
        { name: 'unicode', handle: createMockDirectoryHandle('测试目录') },
      ];

      for (const { name, handle } of scenarios) {
        const message: QueryRequest = {
          id: `directory-${name}`,
          type: 'FETCH_GROUPS',
          handle,
        };

        worker.postMessage(message);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Wait for all responses
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Should handle all scenarios without crashing
      expect(worker).toBeInstanceOf(Worker);

      // Should receive responses (either success or controlled errors)
      const directoryResponses = receivedMessages.filter((r) => r.id.startsWith('directory-'));
      expect(directoryResponses.length).toBe(scenarios.length);
    });

    it('should handle query result type variations', async () => {
      // Test different return types from query functions
      const testHandle = createMockDirectoryHandle('type-test');

      // Mock different return types for different query operations
      vi.mocked(fetchGroups).mockImplementationOnce(async () => []);
      vi.mocked(fetchClients).mockImplementationOnce(async () => ['single-client']);
      vi.mocked(fetchEvaluationsAll).mockImplementationOnce(async () => [
        {
          groupName: 'group1',
          clientName: 'client1',
          evaluationName: 'eval1',
          additionalData: { custom: 'value' },
        },
      ]);

      const queries = [
        { id: 'empty-array', type: 'FETCH_GROUPS' as const },
        { id: 'single-item', type: 'FETCH_CLIENTS' as const, groupName: 'group1' },
        { id: 'complex-object', type: 'FETCH_EVALUATIONS_ALL' as const },
      ];

      receivedMessages.length = 0;

      for (const query of queries) {
        worker.postMessage({
          ...query,
          handle: testHandle,
        });
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Wait for all responses
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Should handle all different return types appropriately
      const responses = receivedMessages.filter((r) => ['empty-array', 'single-item', 'complex-object'].includes(r.id));
      expect(responses.length).toBe(3);

      responses.forEach((response) => {
        expect(response.success).toBe(true);
        if (response.success) {
          expect(response.data).toBeDefined();
        }
      });
    });
  });
});
