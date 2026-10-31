import { describe, it, expect, vi, beforeEach } from 'vitest';

const workerState = vi.hoisted(() => ({ instance: null as null | { onmessage: any; onerror: any } }));

vi.mock('@/App', () => ({
  queryClient: { query: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/workers/mutations/file-query-mutate-worker.ts?worker', () => ({
  default: class {
    onmessage: any;
    onerror: any;
    postMessage = vi.fn();
    constructor() {
      workerState.instance = this as any;
    }
  },
}));

import { mutationEvaluationsWorker } from '../mutate-evaluations';
import { setLocalCachedPrefs, setLocalShowTitle } from '@/lib/local_storage';

const handle = {} as FileSystemDirectoryHandle;
const request = {
  Handle: handle,
  Group: 'Group A',
  Individual: 'AB12',
  Evaluations: ['Evaluation 1'],
  Action: 'Add' as const,
};

describe('mutationEvaluationsWorker', () => {
  beforeEach(() => {
    workerState.instance = null;
  });

  it('resolves with the directories returned by the worker', async () => {
    const promise = mutationEvaluationsWorker(request);
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onmessage({ data: { success: true, data: ['Evaluation 1'] } });

    await expect(promise).resolves.toEqual(['Evaluation 1']);
  });

  it('rejects with the worker error message instead of resolving empty', async () => {
    const promise = mutationEvaluationsWorker(request);
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onmessage({ data: { success: false, error: 'Evaluation already exists.' } });

    await expect(promise).rejects.toThrow('Evaluation already exists.');
  });

  it('rejects when the worker itself fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const promise = mutationEvaluationsWorker(request);
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onerror({ message: 'boom' });

    await expect(promise).rejects.toThrow('boom');
  });

  it('rejects with a fallback message when the worker error has no message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const promise = mutationEvaluationsWorker(request);
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onerror({ message: '' });

    await expect(promise).rejects.toThrow('Worker failed to complete the mutation');
  });

  describe('stored figure settings', () => {
    const run = async (overrides: Partial<typeof request> & { Rename?: string }, success = true) => {
      const promise = mutationEvaluationsWorker({ ...request, ...overrides });
      await vi.waitFor(() => expect(workerState.instance).not.toBeNull());
      workerState.instance!.onmessage({ data: success ? { success: true, data: [] } : { success: false, error: 'x' } });
      return promise;
    };

    beforeEach(() => {
      localStorage.clear();
      setLocalShowTitle('Group A', 'AB12', 'Evaluation 1', 'Rate', false);
      setLocalCachedPrefs('Group A', 'AB12', 'Evaluation 1', 'Rate', {
        KeyDescription: ['SIB'],
        Schedule: 'End on Timer #2',
      });
    });

    it('copies every setting to the new name on duplicate and keeps the original', async () => {
      await run({ Action: 'Duplicate' as never, Rename: 'Evaluation 1_Copy' });

      expect(localStorage.getItem('Group A_AB12_Evaluation 1_Copy_ShowTitle_Rate')).toBe('false');
      expect(JSON.parse(localStorage.getItem('Group A_AB12_Evaluation 1_Copy_Rate')!)).toEqual({
        KeyDescription: ['SIB'],
        Schedule: 'End on Timer #2',
      });
      expect(localStorage.getItem('Group A_AB12_Evaluation 1_ShowTitle_Rate')).toBe('false');
    });

    it('moves every setting to the new name on rename', async () => {
      await run({ Action: 'Rename' as never, Rename: 'Renamed' });

      expect(localStorage.getItem('Group A_AB12_Renamed_ShowTitle_Rate')).toBe('false');
      expect(localStorage.getItem('Group A_AB12_Renamed_Rate')).not.toBeNull();
      expect(localStorage.getItem('Group A_AB12_Evaluation 1_ShowTitle_Rate')).toBeNull();
      expect(localStorage.getItem('Group A_AB12_Evaluation 1_Rate')).toBeNull();
    });

    it('clears every deleted evaluation and nothing else', async () => {
      setLocalShowTitle('Group A', 'AB12', 'Evaluation 2', 'Rate', false);
      setLocalShowTitle('Group A', 'AB12', 'Evaluation 1_Copy', 'Rate', false);

      await run({ Action: 'Delete' as never, Evaluations: ['Evaluation 1', 'Evaluation 2'] });

      expect(Object.keys(localStorage)).toEqual(['Group A_AB12_Evaluation 1_Copy_ShowTitle_Rate']);
    });

    it('leaves stored settings alone when the worker fails', async () => {
      const before = Object.keys(localStorage).sort();

      await expect(run({ Action: 'Delete' as never }, false)).rejects.toThrow('x');

      expect(Object.keys(localStorage).sort()).toEqual(before);
    });

    it('leaves stored settings alone for Add', async () => {
      await run({ Action: 'Add' });

      expect(Object.keys(localStorage)).toHaveLength(2);
    });

    it('still resolves when updating stored settings throws', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
        throw new Error('storage unavailable');
      });

      await expect(run({ Action: 'Duplicate' as never, Rename: 'Copy' })).resolves.toEqual([]);
    });
  });
});
