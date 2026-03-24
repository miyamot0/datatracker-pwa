import '@vitest/web-worker';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import FileQueryMutateWorker from '../mutations/file-query-mutate-worker?worker';
import type {
  MutationRequest,
  MutationResponse,
  MUTATION_TYPES,
} from '../mutations/types/file-query-mutate-worker-types';

// Mock the mutation helper functions to avoid complex FileSystem API mocking
vi.mock('../mutations/helpers/file-query-mutate-actions', () => ({
  mutateConditions: vi.fn(),
  mutateEvaluations: vi.fn(),
  mutateEvaluationsAll: vi.fn(),
  mutateGroups: vi.fn(),
  mutateIndividuals: vi.fn(),
  mutateKeysets: vi.fn(),
  mutateKeysetsAll: vi.fn(),
  mutateSessionOutcomes: vi.fn(),
  mutateSessionParams: vi.fn(),
}));

import {
  mutateConditions,
  mutateEvaluations,
  mutateEvaluationsAll,
  mutateGroups,
  mutateIndividuals,
  mutateKeysets,
  mutateKeysetsAll,
  mutateSessionOutcomes,
  mutateSessionParams,
} from '../mutations/helpers/file-query-mutate-actions';

describe('FileQueryMutateWorker Actual Integration', () => {
  let worker: Worker;
  let receivedMessages: MutationResponse[];
  let messageHandler: (event: MessageEvent<MutationResponse>) => void;

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
    vi.mocked(mutateConditions).mockImplementation(async () => ({ success: true, message: 'Condition mutated' }));
    vi.mocked(mutateEvaluations).mockImplementation(async () => ({ success: true, message: 'Evaluations mutated' }));
    vi.mocked(mutateEvaluationsAll).mockImplementation(async () => ({
      success: true,
      message: 'All evaluations mutated',
    }));
    vi.mocked(mutateGroups).mockImplementation(async () => ({ success: true, message: 'Groups mutated' }));
    vi.mocked(mutateIndividuals).mockImplementation(async () => ({ success: true, message: 'Individuals mutated' }));
    vi.mocked(mutateKeysets).mockImplementation(async () => ({ success: true, message: 'Keysets mutated' }));
    vi.mocked(mutateKeysetsAll).mockImplementation(async () => ({ success: true, message: 'All keysets mutated' }));
    vi.mocked(mutateSessionOutcomes).mockImplementation(async () => ({
      success: true,
      message: 'Session outcomes mutated',
    }));
    vi.mocked(mutateSessionParams).mockImplementation(async () => ({
      success: true,
      message: 'Session params mutated',
    }));

    worker = new FileQueryMutateWorker();
    receivedMessages = [];

    messageHandler = (event: MessageEvent<MutationResponse>) => {
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

      const message: MutationRequest = {
        id: 'test-message',
        type: 'MUTATE_CONDITIONS',
        handle: testHandle,
        groupName: 'test-group',
        individualName: 'test-individual',
        evaluationName: 'test-evaluation',
        action: 'create',
        conditionName: 'test-condition',
      };

      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedMessages.length).toBeGreaterThan(0);
      expect(worker).toBeInstanceOf(Worker);
    });
  });

  describe('Mutation Operations', () => {
    it('should process MUTATE_CONDITIONS message', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: MutationRequest = {
        id: 'test-conditions',
        type: 'MUTATE_CONDITIONS',
        handle: testHandle,
        groupName: 'test-group',
        individualName: 'test-individual',
        evaluationName: 'test-evaluation',
        action: 'create',
        conditionName: 'test-condition',
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-conditions');
      expect(response.success).toBe(true);

      if (response.success) {
        expect(response.data).toEqual({ success: true, message: 'Condition mutated' });
        expect(typeof response.executionTime).toBe('number');
        expect(typeof response.timestamp).toBe('number');
      }

      // Verify the mutation function was called
      expect(mutateConditions).toHaveBeenCalledWith(
        testHandle,
        'test-group',
        'test-individual',
        'test-evaluation',
        'create',
        'test-condition',
      );
    });

    it('should process MUTATE_EVALUATIONS message', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: MutationRequest = {
        id: 'test-evaluations',
        type: 'MUTATE_EVALUATIONS',
        handle: testHandle,
        groupName: 'test-group',
        individualName: 'test-individual',
        evaluationNames: ['eval1', 'eval2'],
        action: 'delete',
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-evaluations');
      expect(response.success).toBe(true);

      // Verify the mutation function was called
      expect(mutateEvaluations).toHaveBeenCalledWith(
        testHandle,
        'test-group',
        'test-individual',
        ['eval1', 'eval2'],
        'delete',
        undefined,
      );
    });

    it('should process MUTATE_GROUPS message', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: MutationRequest = {
        id: 'test-groups',
        type: 'MUTATE_GROUPS',
        handle: testHandle,
        groupNames: ['group1', 'group2'],
        action: 'create',
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-groups');
      expect(response.success).toBe(true);

      // Verify the mutation function was called
      expect(mutateGroups).toHaveBeenCalledWith(testHandle, ['group1', 'group2'], 'create');
    });

    it('should process MUTATE_INDIVIDUALS message', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: MutationRequest = {
        id: 'test-individuals',
        type: 'MUTATE_INDIVIDUALS',
        handle: testHandle,
        groupName: 'test-group',
        individualNames: ['ind1', 'ind2'],
        action: 'rename',
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-individuals');
      expect(response.success).toBe(true);

      // Verify the mutation function was called
      expect(mutateIndividuals).toHaveBeenCalledWith(testHandle, 'test-group', ['ind1', 'ind2'], 'rename');
    });

    it('should process MUTATE_KEYSETS message', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: MutationRequest = {
        id: 'test-keysets',
        type: 'MUTATE_KEYSETS',
        handle: testHandle,
        groupName: 'test-group',
        individualName: 'test-individual',
        keysetNames: ['keyset1'],
        action: 'update',
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-keysets');
      expect(response.success).toBe(true);

      // Verify the mutation function was called
      expect(mutateKeysets).toHaveBeenCalledWith(
        testHandle,
        'test-group',
        'test-individual',
        ['keyset1'],
        'update',
        undefined,
        undefined,
      );
    });

    it('should process MUTATE_SESSION_OUTCOMES message', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');

      const message: MutationRequest = {
        id: 'test-session-outcomes',
        type: 'MUTATE_SESSION_OUTCOMES',
        handle: testHandle,
        groupName: 'test-group',
        individualName: 'test-individual',
        evaluationName: 'test-evaluation',
        outcomes: [],
        sessionOutcomes: [],
        action: 'add',
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-session-outcomes');
      expect(response.success).toBe(true);

      // Verify the mutation function was called
      expect(mutateSessionOutcomes).toHaveBeenCalledWith(
        testHandle,
        'test-group',
        'test-individual',
        'test-evaluation',
        [],
        [],
        'add',
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should process MUTATE_SESSION_PARAMS message', async () => {
      const testHandle = createMockDirectoryHandle('test-handle');
      const settings = { param1: 'value1', param2: 'value2' };

      const message: MutationRequest = {
        id: 'test-session-params',
        type: 'MUTATE_SESSION_PARAMS',
        handle: testHandle,
        groupName: 'test-group',
        individualName: 'test-individual',
        evaluationName: 'test-evaluation',
        settings,
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('test-session-params');
      expect(response.success).toBe(true);

      // Verify the mutation function was called
      expect(mutateSessionParams).toHaveBeenCalledWith(
        testHandle,
        'test-group',
        'test-individual',
        'test-evaluation',
        settings,
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed messages gracefully', async () => {
      const malformedMessages = [
        null,
        undefined,
        {},
        { id: 'test' }, // Missing type
        { type: 'MUTATE_CONDITIONS' }, // Missing id
        { id: '', type: 'MUTATE_CONDITIONS' }, // Empty id
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

    it('should handle unknown mutation type', async () => {
      const message: MutationRequest = {
        id: 'test-unknown',
        type: 'UNKNOWN_MUTATION_TYPE' as any,
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
        expect(response.error).toContain('Unsupported mutation type');
      }
    });

    it('should handle mutation function errors', async () => {
      // Set up mock to throw error
      vi.mocked(mutateConditions).mockImplementationOnce(async () => {
        throw new Error('Mutation operation failed');
      });

      const testHandle = createMockDirectoryHandle('test-handle');

      const message: MutationRequest = {
        id: 'test-error',
        type: 'MUTATE_CONDITIONS',
        handle: testHandle,
        groupName: 'test-group',
        individualName: 'test-individual',
        evaluationName: 'test-evaluation',
        action: 'create',
        conditionName: 'test-condition',
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const errorResponse = receivedMessages.find((msg) => !msg.success);
      expect(errorResponse).toBeDefined();

      if (errorResponse && !errorResponse.success) {
        expect(errorResponse.id).toBe('test-error');
        expect(errorResponse.error).toContain('Mutation operation failed');
        expect(typeof errorResponse.executionTime).toBe('number');
        expect(typeof errorResponse.timestamp).toBe('number');
      }
    });

    it('should handle FileSystem API errors', async () => {
      // Set up mock to throw FileSystem-specific error
      vi.mocked(mutateGroups).mockImplementationOnce(async () => {
        throw new Error('The requested file could not be read, typically due to permission problems');
      });

      const testHandle = createMockDirectoryHandle('test-handle');

      const message: MutationRequest = {
        id: 'test-filesystem-error',
        type: 'MUTATE_GROUPS',
        handle: testHandle,
        groupNames: ['test-group'],
        action: 'create',
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
      const messages: MutationRequest[] = [
        {
          id: 'concurrent-1',
          type: 'MUTATE_CONDITIONS',
          handle: testHandle,
          groupName: 'group1',
          individualName: 'individual1',
          evaluationName: 'evaluation1',
          action: 'create',
          conditionName: 'condition1',
        },
        {
          id: 'concurrent-2',
          type: 'MUTATE_GROUPS',
          handle: testHandle,
          groupNames: ['group2'],
          action: 'delete',
        },
        {
          id: 'concurrent-3',
          type: 'MUTATE_INDIVIDUALS',
          handle: testHandle,
          groupName: 'group3',
          individualNames: ['individual3'],
          action: 'rename',
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
        const message: MutationRequest = {
          id: `rapid-${i}`,
          type: 'MUTATE_CONDITIONS',
          handle: testHandle,
          groupName: `group-${i}`,
          individualName: `individual-${i}`,
          evaluationName: `evaluation-${i}`,
          action: 'create',
          conditionName: `condition-${i}`,
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
      vi.mocked(mutateConditions).mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { success: true, message: 'Delayed mutation' };
      });

      const testHandle = createMockDirectoryHandle('test-handle');

      const message: MutationRequest = {
        id: 'timing-test',
        type: 'MUTATE_CONDITIONS',
        handle: testHandle,
        groupName: 'test-group',
        individualName: 'test-individual',
        evaluationName: 'test-evaluation',
        action: 'create',
        conditionName: 'test-condition',
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

      const validMessage: MutationRequest = {
        id: 'validation-test',
        type: 'MUTATE_CONDITIONS',
        handle: testHandle,
        groupName: 'test-group',
        individualName: 'test-individual',
        evaluationName: 'test-evaluation',
        action: 'create',
        conditionName: 'test-condition',
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
      const message: MutationRequest = {
        id: 'lifecycle-test',
        type: 'MUTATE_CONDITIONS',
        handle: testHandle,
        groupName: 'test-group',
        individualName: 'test-individual',
        evaluationName: 'test-evaluation',
        action: 'create',
        conditionName: 'test-condition',
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
    it('should handle complex mutation request patterns', async () => {
      const testHandle = createMockDirectoryHandle('complex-test');

      // Test complex keysets mutation with multiple parameters
      const message: MutationRequest = {
        id: 'complex-keysets',
        type: 'MUTATE_KEYSETS',
        handle: testHandle,
        groupName: 'complex-group',
        individualName: 'complex-individual',
        keysetNames: ['keyset1', 'keyset2', 'keyset3'],
        action: 'update',
        renameTo: 'new-keyset-name',
        newKeySet: {
          id: 'new-keyset-id',
          name: 'New KeySet',
          keys: [],
        },
      };

      receivedMessages.length = 0;
      worker.postMessage(message);
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(receivedMessages.length).toBeGreaterThan(0);

      const response = receivedMessages[receivedMessages.length - 1];
      expect(response.id).toBe('complex-keysets');
      expect(response.success).toBe(true);

      // Verify all parameters were passed correctly
      expect(mutateKeysets).toHaveBeenCalledWith(
        testHandle,
        'complex-group',
        'complex-individual',
        ['keyset1', 'keyset2', 'keyset3'],
        'update',
        'new-keyset-name',
        {
          id: 'new-keyset-id',
          name: 'New KeySet',
          keys: [],
        },
      );
    });

    it('should handle directory handle edge cases', async () => {
      // Test with different directory handle scenarios
      const scenarios = [
        { name: 'empty-name', handle: createMockDirectoryHandle('') },
        { name: 'special-chars', handle: createMockDirectoryHandle('test-dir-@#$%') },
        { name: 'nested-structure', handle: createMockDirectoryHandle('parent/child/grandchild') },
      ];

      for (const { name, handle } of scenarios) {
        const message: MutationRequest = {
          id: `directory-${name}`,
          type: 'MUTATE_GROUPS',
          handle,
          groupNames: [`group-${name}`],
          action: 'create',
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
  });
});
