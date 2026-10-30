// @ts-nocheck

import '@vitest/web-worker';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import FileQueryReadWorker from '../queries/file-query-read-worker?worker';

// The worker imports these from lib, so the mocks let the tests check message routing and response shape
vi.mock('../../lib/query-read', () => ({
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
} from '../../lib/query-read';

describe('FileQueryReadWorker Actual Integration', () => {
  let worker: Worker;
  let received: any[] = [];
  let seq = 0;
  const handle = { name: 'test-handle', kind: 'directory' } as FileSystemDirectoryHandle;

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

  const query = async (type: string, fields: Record<string, unknown> = {}) => {
    const id = `req-${++seq}`;
    worker.postMessage({ id, type, handle, ...fields });
    return responseFor(id);
  };

  beforeAll(() => {
    worker = new FileQueryReadWorker();
    worker.addEventListener('message', onMessage);
  });

  afterAll(() => {
    worker.removeEventListener('message', onMessage);
    worker.terminate();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    received = [];

    vi.mocked(fetchDirectories).mockResolvedValue(['dir1', 'dir2']);
    vi.mocked(fetchGroups).mockResolvedValue(['group1', 'group2']);
    vi.mocked(fetchClients).mockResolvedValue(['client1']);
    vi.mocked(fetchEvaluations).mockResolvedValue(['evaluation1']);
    vi.mocked(fetchEvaluationsAll).mockResolvedValue([{ groupName: 'g', clientName: 'c', evaluationName: 'e' }]);
    vi.mocked(fetchConditions).mockResolvedValue(['condition1']);
    vi.mocked(fetchKeysets).mockResolvedValue([{ id: '1', name: 'keyset1', keys: [] }]);
    vi.mocked(fetchKeysetsAll).mockResolvedValue([{ id: '2', name: 'keyset2', keys: [] }]);
    vi.mocked(fetchSessionParams).mockResolvedValue({ param1: 'value1' });
    vi.mocked(fetchSessionOutcomes).mockResolvedValue([{ sessionId: '1', outcome: 'success' }]);
  });

  describe('Worker Instantiation', () => {
    it('should create a worker instance', () => {
      expect(worker).toBeInstanceOf(Worker);
    });
  });

  describe('Query Routing', () => {
    const groupArgs = { groupName: 'G' };
    const individualArgs = { groupName: 'G', individualName: 'I' };
    const evaluationArgs = { groupName: 'G', individualName: 'I', evaluationName: 'E' };

    it.each([
      ['FETCH_GROUPS', {}, () => fetchGroups, [], ['group1', 'group2']],
      ['FETCH_CLIENTS', groupArgs, () => fetchClients, ['G'], ['client1']],
      ['FETCH_EVALUATIONS', { groupName: 'G', clientName: 'C' }, () => fetchEvaluations, ['G', 'C'], ['evaluation1']],
      ['FETCH_EVALUATIONS_ALL', {}, () => fetchEvaluationsAll, [], [{ groupName: 'g', clientName: 'c', evaluationName: 'e' }]],
      ['FETCH_CONDITIONS', evaluationArgs, () => fetchConditions, ['G', 'I', 'E'], ['condition1']],
      ['FETCH_KEYSETS', individualArgs, () => fetchKeysets, ['G', 'I'], [{ id: '1', name: 'keyset1', keys: [] }]],
      ['FETCH_KEYSETS_ALL', individualArgs, () => fetchKeysetsAll, ['G', 'I'], [{ id: '2', name: 'keyset2', keys: [] }]],
      ['FETCH_SESSION_PARAMS', evaluationArgs, () => fetchSessionParams, ['G', 'I', 'E'], { param1: 'value1' }],
      ['FETCH_OUTCOMES', evaluationArgs, () => fetchSessionOutcomes, ['G', 'I', 'E'], [{ sessionId: '1', outcome: 'success' }]],
    ])('%s calls the matching query with its arguments and returns the result', async (type, fields, getFn, args, expected) => {
      const response = await query(type, fields);

      expect(getFn()).toHaveBeenCalledTimes(1);
      expect(getFn()).toHaveBeenCalledWith(expect.objectContaining({ name: 'test-handle' }), ...args);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(expected);
    });

    it('should map FETCH_DIRECTORIES to fetchDirectories with path and filter options', async () => {
      const response = await query('FETCH_DIRECTORIES', {
        path: ['a', 'b'],
        filterPattern: /\.json$/,
        excludeSystemFiles: true,
      });

      expect(fetchDirectories).toHaveBeenCalledWith(expect.objectContaining({ name: 'test-handle' }), {
        path: ['a', 'b'],
        filterPattern: /\.json$/,
        excludeSystemFiles: true,
      });
      expect(response.success).toBe(true);
      expect(response.data).toEqual(['dir1', 'dir2']);
    });

    it('should map FETCH_SESSIONS to fetchDirectories', async () => {
      const response = await query('FETCH_SESSIONS', { path: ['x'] });

      expect(fetchDirectories).toHaveBeenCalledWith(expect.objectContaining({ name: 'test-handle' }), {
        path: ['x'],
        filterPattern: undefined,
        excludeSystemFiles: undefined,
      });
      expect(response.success).toBe(true);
    });

    it('should include id, timestamp, and execution time in success responses', async () => {
      const response = await query('FETCH_GROUPS');

      expect(response.id).toMatch(/^req-\d+$/);
      expect(typeof response.timestamp).toBe('number');
      expect(response.executionTime).toBeGreaterThanOrEqual(0);
      expect(response).not.toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    it('should report query errors with message and stack', async () => {
      vi.mocked(fetchGroups).mockRejectedValueOnce(new Error('disk gone'));

      const response = await query('FETCH_GROUPS');

      expect(response.success).toBe(false);
      expect(response.error).toBe('disk gone');
      expect(typeof response.stack).toBe('string');
      expect(response).not.toHaveProperty('data');
    });

    it('should use a generic message when a non-Error is thrown', async () => {
      vi.mocked(fetchClients).mockRejectedValueOnce('plain string');

      const response = await query('FETCH_CLIENTS', { groupName: 'G' });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Unknown error occurred');
      expect(response.stack).toBeUndefined();
    });

    it('should report unsupported query types', async () => {
      const response = await query('NOT_A_QUERY');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Unsupported query type: NOT_A_QUERY');
    });

    it('should reject requests missing an id or type', async () => {
      worker.postMessage({ type: 'FETCH_GROUPS', handle });
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
      await query('NOT_A_QUERY');
      const response = await query('FETCH_GROUPS');

      expect(response.success).toBe(true);
      expect(response.data).toEqual(['group1', 'group2']);
    });
  });

  describe('Concurrency and Ordering', () => {
    it('should answer several concurrent requests, each under its own id', async () => {
      const ids = ['c-1', 'c-2', 'c-3', 'c-4', 'c-5'];
      for (const id of ids) {
        worker.postMessage({ id, type: 'FETCH_GROUPS', handle });
      }

      const responses = await Promise.all(ids.map((id) => responseFor(id)));

      expect(responses.map((r) => r.id)).toEqual(ids);
      expect(responses.every((r) => r.success === true)).toBe(true);
      expect(fetchGroups).toHaveBeenCalledTimes(5);
    });

    it('should return a fast reply before a slower earlier request finishes', async () => {
      vi.mocked(fetchGroups).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve(['slow']), 150)),
      );
      vi.mocked(fetchClients).mockResolvedValueOnce(['fast']);

      worker.postMessage({ id: 'slow-groups', type: 'FETCH_GROUPS', handle });
      worker.postMessage({ id: 'fast-clients', type: 'FETCH_CLIENTS', handle, groupName: 'G' });

      const fast = await responseFor('fast-clients');
      expect(received.find((msg) => msg?.id === 'slow-groups')).toBeUndefined();

      const slow = await responseFor('slow-groups');
      expect(fast.data).toEqual(['fast']);
      expect(slow.data).toEqual(['slow']);
    });
  });
});
