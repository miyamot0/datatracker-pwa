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

import { mutationKeysetsWorker } from '../mutate-session-outcomes';
import {
  getLocalHiddenConditions,
  getLocalSeriesStyles,
  setLocalHiddenConditions,
  setLocalSeriesStyles,
} from '@/lib/local_storage';

const styles = (ConditionStyles: Record<string, { color: string }>) => ({
  KeyStyles: {},
  ConditionStyles,
  phase_changes: [],
  text_annotations: [],
  aim_lines: [],
});

const handle = {} as FileSystemDirectoryHandle;
const request = {
  Group: 'Group A',
  Individual: 'AB12',
  Evaluation: 'Evaluation 1',
  Outcomes: [],
  Handle: handle,
  CurrentOutcomes: [],
  Action: 'Delete' as const,
};

describe('mutationKeysetsWorker (session outcomes)', () => {
  beforeEach(() => {
    workerState.instance = null;
  });

  it('resolves with the outcomes returned by the worker', async () => {
    const promise = mutationKeysetsWorker(request as any);
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onmessage({ data: { success: true, data: [] } });

    await expect(promise).resolves.toEqual([]);
  });

  it('rejects with the worker error message instead of resolving empty', async () => {
    const promise = mutationKeysetsWorker(request as any);
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onmessage({ data: { success: false, error: 'Outcome could not be deleted.' } });

    await expect(promise).rejects.toThrow('Outcome could not be deleted.');
  });

  it('rejects when the worker itself fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const promise = mutationKeysetsWorker(request as any);
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onerror({ message: 'boom' });

    await expect(promise).rejects.toThrow('boom');
  });

  it('rejects with a fallback message when the worker error has no message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const promise = mutationKeysetsWorker(request as any);
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onerror({ message: '' });

    await expect(promise).rejects.toThrow('Worker failed to complete the mutation');
  });

  describe('condition rename', () => {
    const session = (Filename: string, Condition: string) => ({ Filename, SessionSettings: { Condition } });
    const all = [session('a', 'Baseline'), session('b', 'Tx')];
    const run = async (success = true, overrides: Record<string, unknown> = {}) => {
      const promise = mutationKeysetsWorker({
        ...request,
        Action: 'EditCondition',
        ConditionRename: 'BL',
        Outcomes: [all[0]],
        CurrentOutcomes: all,
        ...overrides,
      } as any);
      await vi.waitFor(() => expect(workerState.instance).not.toBeNull());
      workerState.instance!.onmessage({ data: success ? { success: true, data: [] } : { success: false, error: 'x' } });
      return promise;
    };

    beforeEach(() => {
      localStorage.clear();
      setLocalSeriesStyles('Group A', 'AB12', 'Evaluation 1', styles({ Baseline: { color: '#111111' } }));
      setLocalHiddenConditions('Group A', 'AB12', 'Evaluation 1', ['Baseline']);
    });

    it('carries the condition styles to the new name once the rename succeeds', async () => {
      await run();

      expect(getLocalSeriesStyles('Group A', 'AB12', 'Evaluation 1').ConditionStyles).toEqual({
        BL: { color: '#111111' },
      });
      expect(getLocalHiddenConditions('Group A', 'AB12', 'Evaluation 1')).toEqual(['BL']);
    });

    it('leaves the styles alone when the worker fails', async () => {
      await expect(run(false)).rejects.toThrow('x');

      expect(getLocalSeriesStyles('Group A', 'AB12', 'Evaluation 1').ConditionStyles).toEqual({
        Baseline: { color: '#111111' },
      });
    });

    it('leaves the styles alone for other actions', async () => {
      await run(true, { Action: 'Delete' });

      expect(getLocalHiddenConditions('Group A', 'AB12', 'Evaluation 1')).toEqual(['Baseline']);
    });

    it('still resolves when updating the stored styles throws', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
        throw new Error('storage unavailable');
      });

      await expect(run()).resolves.toEqual([]);
    });
  });
});
