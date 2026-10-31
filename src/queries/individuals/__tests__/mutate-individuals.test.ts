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
import { setLocalShowTitle } from '@/lib/local_storage';

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

  describe('stored figure settings on delete', () => {
    const folders = {
      'Group A': { AB12: { 'Evaluation 1': {}, 'Evaluation 2': {} }, CD34: { 'Evaluation 1': {} } },
    } as Record<string, Record<string, Record<string, object>>>;

    const directory = (tree: Record<string, any>): FileSystemDirectoryHandle =>
      ({
        async getDirectoryHandle(name: string) {
          if (!(name in tree)) throw new DOMException('missing', 'NotFoundError');
          return directory(tree[name]);
        },
        async *entries() {
          for (const name of Object.keys(tree)) yield [name, { kind: 'directory' }];
        },
      }) as unknown as FileSystemDirectoryHandle;

    beforeEach(() => {
      localStorage.clear();
      setLocalShowTitle('Group A', 'AB12', 'Evaluation 1', 'Rate', false);
      setLocalShowTitle('Group A', 'AB12', 'Evaluation 2', 'Rate', false);
      setLocalShowTitle('Group A', 'CD34', 'Evaluation 1', 'Rate', false);
    });

    it('clears the settings of every evaluation under the deleted individual only', async () => {
      const promise = mutationIndividualsWorker({
        ...request,
        Handle: directory(folders),
        Action: 'Delete',
      });
      await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

      workerState.instance!.onmessage({ data: { success: true, data: ['CD34'] } });
      await promise;

      expect(Object.keys(localStorage)).toEqual(['Group A_CD34_Evaluation 1_ShowTitle_Rate']);
    });

    it('keeps the settings when the worker fails', async () => {
      const promise = mutationIndividualsWorker({ ...request, Handle: directory(folders), Action: 'Delete' });
      await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

      workerState.instance!.onmessage({ data: { success: false, error: 'nope' } });

      await expect(promise).rejects.toThrow('nope');
      expect(Object.keys(localStorage)).toHaveLength(3);
    });

    it('does not touch settings when adding', async () => {
      const promise = mutationIndividualsWorker({ ...request, Handle: directory(folders), Action: 'Add' });
      await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

      workerState.instance!.onmessage({ data: { success: true, data: ['AB12'] } });
      await promise;

      expect(Object.keys(localStorage)).toHaveLength(3);
    });
  });
});
