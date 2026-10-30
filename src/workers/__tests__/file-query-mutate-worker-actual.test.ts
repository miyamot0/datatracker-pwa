// @ts-nocheck

import '@vitest/web-worker';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import FileQueryMutateWorker from '../mutations/file-query-mutate-worker?worker';

// The worker imports these from lib, so the mocks let the tests check message routing and response shape
vi.mock('../../lib/query-mutate', () => ({
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
} from '../../lib/query-mutate';

describe('FileQueryMutateWorker Actual Integration', () => {
  let worker: Worker;
  let received: any[] = [];
  let seq = 0;
  const handle = { name: 'test-handle', kind: 'directory' } as FileSystemDirectoryHandle;
  const ok = { success: true, message: 'ok' };

  const onMessage = (event: MessageEvent) => {
    received.push(event.data);
  };

  // Waits for the reply to a specific request id, so tests never rely on fixed sleeps
  const responseFor = (id: string) =>
    vi.waitFor(
      () => {
        const found = received.find((msg) => msg?.id === id);
        expect(found).toBeDefined();
        return found;
      },
      { timeout: 3000 },
    );

  const mutate = async (type: string, fields: Record<string, unknown> = {}) => {
    const id = `req-${++seq}`;
    worker.postMessage({ id, type, handle, ...fields });
    return responseFor(id);
  };

  beforeAll(() => {
    worker = new FileQueryMutateWorker();
    worker.addEventListener('message', onMessage);
  });

  afterAll(() => {
    worker.removeEventListener('message', onMessage);
    worker.terminate();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    received = [];

    vi.mocked(mutateConditions).mockResolvedValue(ok);
    vi.mocked(mutateEvaluations).mockResolvedValue(ok);
    vi.mocked(mutateEvaluationsAll).mockResolvedValue(ok);
    vi.mocked(mutateGroups).mockResolvedValue(ok);
    vi.mocked(mutateIndividuals).mockResolvedValue(ok);
    vi.mocked(mutateKeysets).mockResolvedValue(ok);
    vi.mocked(mutateKeysetsAll).mockResolvedValue(ok);
    vi.mocked(mutateSessionOutcomes).mockResolvedValue(ok);
    vi.mocked(mutateSessionParams).mockResolvedValue(ok);
  });

  describe('Worker Instantiation', () => {
    it('should create a worker instance', () => {
      expect(worker).toBeInstanceOf(Worker);
    });
  });

  describe('Mutation Routing', () => {
    const newKeySet = { id: 'k-new', name: 'New keyset', keys: [] };
    const keySets = [{ id: 'k1', name: 'Keyset one', keys: [] }];
    const outcomes = ['o1'];
    const settings = { param1: 'value1', param2: 'value2' };

    it.each([
      [
        'MUTATE_CONDITIONS',
        { groupName: 'G', individualName: 'I', evaluationName: 'E', action: 'create', conditionName: 'C' },
        () => mutateConditions,
        ['G', 'I', 'E', 'create', 'C'],
      ],
      [
        'MUTATE_EVALUATIONS',
        { groupName: 'G', individualName: 'I', evaluationNames: ['e1'], action: 'rename', renameTo: 'e2' },
        () => mutateEvaluations,
        ['G', 'I', ['e1'], 'rename', 'e2'],
      ],
      [
        'MUTATE_EVALUATIONS_ALL',
        { groupName: 'G', individualName: 'I', action: 'delete', allRecords: [1], relevantRecords: [2] },
        () => mutateEvaluationsAll,
        ['G', 'I', 'delete', [1], [2]],
      ],
      ['MUTATE_GROUPS', { groupNames: ['g1', 'g2'], action: 'create' }, () => mutateGroups, [['g1', 'g2'], 'create']],
      [
        'MUTATE_INDIVIDUALS',
        { groupName: 'G', individualNames: ['i1'], action: 'rename' },
        () => mutateIndividuals,
        ['G', ['i1'], 'rename'],
      ],
      [
        'MUTATE_KEYSETS',
        { groupName: 'G', individualName: 'I', keysetNames: ['k1'], action: 'update', renameTo: 'k2', newKeySet },
        () => mutateKeysets,
        ['G', 'I', ['k1'], 'update', 'k2', newKeySet],
      ],
      [
        'MUTATE_KEYSETS_ALL',
        { groupName: 'G', individualName: 'I', keySets, allKeySets: true },
        () => mutateKeysetsAll,
        ['G', 'I', keySets, true],
      ],
      [
        'MUTATE_SESSION_OUTCOMES',
        {
          groupName: 'G',
          individualName: 'I',
          evaluationName: 'E',
          outcomes,
          sessionOutcomes: [],
          action: 'add',
          conditionRename: 'cr',
          updatedOutcome: 'u',
          priorOutcome: 'p',
          newOutcome: 'n',
        },
        () => mutateSessionOutcomes,
        ['G', 'I', 'E', outcomes, [], 'add', 'cr', 'u', 'p', 'n'],
      ],
      [
        'MUTATE_SESSION_PARAMS',
        { groupName: 'G', individualName: 'I', evaluationName: 'E', settings },
        () => mutateSessionParams,
        ['G', 'I', 'E', settings],
      ],
    ])('%s calls the matching mutation with its arguments and returns the result', async (type, fields, getFn, args) => {
      const response = await mutate(type, fields);

      expect(getFn()).toHaveBeenCalledTimes(1);
      expect(getFn()).toHaveBeenCalledWith(expect.objectContaining({ name: 'test-handle' }), ...args);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(ok);
    });

    it('should include id, timestamp, and execution time in success responses', async () => {
      const response = await mutate('MUTATE_GROUPS', { groupNames: ['g1'], action: 'create' });

      expect(response.id).toMatch(/^req-\d+$/);
      expect(typeof response.timestamp).toBe('number');
      expect(response.executionTime).toBeGreaterThanOrEqual(0);
      expect(response).not.toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    it('should report mutation errors with message and stack', async () => {
      vi.mocked(mutateGroups).mockRejectedValueOnce(new Error('write failed'));

      const response = await mutate('MUTATE_GROUPS', { groupNames: ['g1'], action: 'delete' });

      expect(response.success).toBe(false);
      expect(response.error).toBe('write failed');
      expect(typeof response.stack).toBe('string');
      expect(response).not.toHaveProperty('data');
    });

    it('should use a generic message when a non-Error is thrown', async () => {
      vi.mocked(mutateConditions).mockRejectedValueOnce('plain string');

      const response = await mutate('MUTATE_CONDITIONS', {
        groupName: 'G',
        individualName: 'I',
        evaluationName: 'E',
        action: 'create',
        conditionName: 'C',
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Unknown error occurred');
      expect(response.stack).toBeUndefined();
    });

    it('should report unsupported mutation types', async () => {
      const response = await mutate('UNKNOWN_MUTATION_TYPE');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Unsupported mutation type: UNKNOWN_MUTATION_TYPE');
    });

    it('should reject requests missing an id or type', async () => {
      worker.postMessage({ type: 'MUTATE_GROUPS', handle, groupNames: [], action: 'create' });
      const missingId = await vi.waitFor(() => {
        const found = received.find((msg) => msg?.id === 'unknown');
        expect(found).toBeDefined();
        return found;
      });

      expect(missingId.success).toBe(false);
      expect(missingId.error).toBe('Invalid request: missing id or type');

      received = [];
      worker.postMessage({ id: 'no-type', handle });
      const missingType = await responseFor('no-type');

      expect(missingType.success).toBe(false);
      expect(missingType.error).toBe('Invalid request: missing id or type');
    });

    it('should answer null messages without crashing', async () => {
      worker.postMessage(null);
      const response = await vi.waitFor(() => {
        const found = received.find((msg) => msg?.id === 'unknown');
        expect(found).toBeDefined();
        return found;
      });

      expect(response.success).toBe(false);
    });

    it('should keep answering valid requests after an error', async () => {
      await mutate('UNKNOWN_MUTATION_TYPE');
      const response = await mutate('MUTATE_GROUPS', { groupNames: ['g1'], action: 'create' });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(ok);
    });
  });

  describe('Concurrency and Ordering', () => {
    it('should answer several concurrent requests, each under its own id', async () => {
      const ids = ['c-1', 'c-2', 'c-3', 'c-4', 'c-5'];
      for (const id of ids) {
        worker.postMessage({ id, type: 'MUTATE_GROUPS', handle, groupNames: ['g'], action: 'create' });
      }

      const responses = await Promise.all(ids.map((id) => responseFor(id)));

      expect(responses.map((r) => r.id)).toEqual(ids);
      expect(responses.every((r) => r.success === true)).toBe(true);
      expect(mutateGroups).toHaveBeenCalledTimes(5);
    });

    it('should return a fast reply before a slower earlier request finishes', async () => {
      vi.mocked(mutateGroups).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, message: 'slow' }), 150)),
      );
      vi.mocked(mutateIndividuals).mockResolvedValueOnce({ success: true, message: 'fast' });

      worker.postMessage({ id: 'slow-groups', type: 'MUTATE_GROUPS', handle, groupNames: ['g'], action: 'create' });
      worker.postMessage({
        id: 'fast-individuals',
        type: 'MUTATE_INDIVIDUALS',
        handle,
        groupName: 'G',
        individualNames: ['i'],
        action: 'rename',
      });

      const fast = await responseFor('fast-individuals');
      expect(received.find((msg) => msg?.id === 'slow-groups')).toBeUndefined();

      const slow = await responseFor('slow-groups');
      expect(fast.data.message).toBe('fast');
      expect(slow.data.message).toBe('slow');
    });
  });
});
