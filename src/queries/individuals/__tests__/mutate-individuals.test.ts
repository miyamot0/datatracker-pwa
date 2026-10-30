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

import { mutationIndividualsWorker } from '../mutate-individuals';

const handle = {} as FileSystemDirectoryHandle;
const request = { Handle: handle, Group: 'Group A', Individuals: ['AB12'], Action: 'Add' as const };

describe('mutationIndividualsWorker', () => {
  beforeEach(() => {
    workerState.instance = null;
  });

  it('resolves with the directories returned by the worker', async () => {
    const promise = mutationIndividualsWorker(request);
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onmessage({ data: { success: true, data: ['AB12'] } });

    await expect(promise).resolves.toEqual(['AB12']);
  });

  it('rejects with the worker error message instead of resolving empty', async () => {
    const promise = mutationIndividualsWorker(request);
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onmessage({ data: { success: false, error: 'Participant already exists.' } });

    await expect(promise).rejects.toThrow('Participant already exists.');
  });

  it('rejects when the worker itself fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const promise = mutationIndividualsWorker(request);
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onerror({ message: 'boom' });

    await expect(promise).rejects.toThrow('boom');
  });

  it('rejects with a fallback message when the worker error has no message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const promise = mutationIndividualsWorker(request);
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onerror({ message: '' });

    await expect(promise).rejects.toThrow('Worker failed to complete the mutation');
  });
});
