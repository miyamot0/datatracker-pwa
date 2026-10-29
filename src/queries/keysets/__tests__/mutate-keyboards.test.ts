import { describe, it, expect, vi, beforeEach } from 'vitest';

const workerState = vi.hoisted(() => ({ instance: null as null | { onmessage: any; onerror: any } }));

vi.mock('@/App', () => ({
  queryClient: { fetchQuery: vi.fn().mockResolvedValue([]) },
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

import { mutationKeysetsWorker } from '../mutate-keyboards';

const handle = {} as FileSystemDirectoryHandle;
const request = {
  Handle: handle,
  Group: 'Group A',
  Individual: 'AB12',
  Keysets: ['Keyset 1'],
  Action: 'Delete' as const,
};

describe('mutationKeysetsWorker (keyboards)', () => {
  beforeEach(() => {
    workerState.instance = null;
  });

  it('resolves with the keysets returned by the worker', async () => {
    const promise = mutationKeysetsWorker(request);
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onmessage({ data: { success: true, data: ['Keyset 2'] } });

    await expect(promise).resolves.toEqual(['Keyset 2']);
  });

  it('rejects with the worker error message instead of resolving empty', async () => {
    const promise = mutationKeysetsWorker(request);
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onmessage({ data: { success: false, error: 'Keyset is in use.' } });

    await expect(promise).rejects.toThrow('Keyset is in use.');
  });

  it('rejects when the worker itself fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const promise = mutationKeysetsWorker(request);
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onerror({ message: 'boom' });

    await expect(promise).rejects.toThrow('boom');
  });

  it('rejects with a fallback message when the worker error has no message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const promise = mutationKeysetsWorker(request);
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onerror({ message: '' });

    await expect(promise).rejects.toThrow('Worker failed to complete the mutation');
  });
});
