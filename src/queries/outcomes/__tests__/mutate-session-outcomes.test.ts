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
});
