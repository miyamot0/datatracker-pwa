import { describe, it, expect, vi, beforeEach } from 'vitest';

const workerState = vi.hoisted(() => ({ instance: null as null | { onmessage: any; onerror: any } }));

vi.mock('@/App', () => ({
  queryClient: { query: vi.fn().mockResolvedValue(['Group A']) },
}));

const demoStyleMocks = vi.hoisted(() => ({
  loadDemoStyles: vi.fn(),
  applyDemoStyles: vi.fn(),
}));

vi.mock('@/lib/demo-styles', () => demoStyleMocks);

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

import { mutationGroups } from '../mutate-groups';
import { setLocalShowTitle } from '@/lib/local_storage';

const handle = {} as FileSystemDirectoryHandle;

describe('mutationGroups', () => {
  beforeEach(() => {
    workerState.instance = null;
    demoStyleMocks.loadDemoStyles.mockReset().mockResolvedValue([]);
    demoStyleMocks.applyDemoStyles.mockReset();
  });

  it('applies bundled demo styles on the main thread after the worker copies the demo', async () => {
    const entries = [{ individual: 'Participant 001', evaluation: 'Tangible Treatment Evaluation', styles: {} }];
    demoStyleMocks.loadDemoStyles.mockResolvedValue(entries);

    const promise = mutationGroups({ Group: ['Example DataTracker Group'], Handle: handle, Action: 'Demo' });
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onmessage({ data: { success: true, data: ['Example DataTracker Group'] } });

    await expect(promise).resolves.toEqual(['Example DataTracker Group']);
    expect(demoStyleMocks.applyDemoStyles).toHaveBeenCalledWith(entries);
  });

  it('does not apply demo styles when the worker fails', async () => {
    const promise = mutationGroups({ Group: ['Example DataTracker Group'], Handle: handle, Action: 'Demo' });
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onmessage({ data: { success: false, error: 'boom' } });

    await expect(promise).rejects.toThrow('boom');
    expect(demoStyleMocks.applyDemoStyles).not.toHaveBeenCalled();
  });

  it('does not load demo styles for non-demo actions', async () => {
    const promise = mutationGroups({ Group: ['Group A'], Handle: handle, Action: 'Add' });
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onmessage({ data: { success: true, data: ['Group A'] } });

    await promise;
    expect(demoStyleMocks.loadDemoStyles).not.toHaveBeenCalled();
    expect(demoStyleMocks.applyDemoStyles).not.toHaveBeenCalled();
  });

  it('resolves with the directories returned by the worker', async () => {
    const promise = mutationGroups({ Group: ['Group A'], Handle: handle, Action: 'Add' });
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onmessage({ data: { success: true, data: ['Group A', 'Group B'] } });

    await expect(promise).resolves.toEqual(['Group A', 'Group B']);
  });

  it('rejects with the worker error message instead of resolving empty', async () => {
    const promise = mutationGroups({ Group: ['Example DataTracker Group'], Handle: handle, Action: 'Demo' });
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onmessage({
      data: { success: false, error: 'The Example DataTracker Group folder already exists.' },
    });

    await expect(promise).rejects.toThrow('The Example DataTracker Group folder already exists.');
  });

  it('rejects when the worker itself fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const promise = mutationGroups({ Group: ['Group A'], Handle: handle, Action: 'Add' });
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onerror({ message: 'boom' });

    await expect(promise).rejects.toThrow('boom');
  });

  it('rejects with a fallback message when the worker error has no message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const promise = mutationGroups({ Group: ['Group A'], Handle: handle, Action: 'Add' });
    await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

    workerState.instance!.onerror({ message: '' });

    await expect(promise).rejects.toThrow('Worker failed to complete the mutation');
  });

  describe('stored figure settings on delete', () => {
    const folders: Record<string, any> = {
      'Group A': { AB12: { 'Evaluation 1': {} }, CD34: { 'Evaluation 1': {} } },
      'Group B': { EF56: { 'Evaluation 1': {} } },
    };

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
      setLocalShowTitle('Group A', 'CD34', 'Evaluation 1', 'Rate', false);
      setLocalShowTitle('Group B', 'EF56', 'Evaluation 1', 'Rate', false);
    });

    it('clears the settings of every evaluation in the deleted group only', async () => {
      const promise = mutationGroups({ Group: ['Group A'], Handle: directory(folders), Action: 'Delete' });
      await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

      workerState.instance!.onmessage({ data: { success: true, data: ['Group B'] } });
      await promise;

      expect(Object.keys(localStorage)).toEqual(['Group B_EF56_Evaluation 1_ShowTitle_Rate']);
    });

    it('keeps the settings when the worker fails', async () => {
      const promise = mutationGroups({ Group: ['Group A'], Handle: directory(folders), Action: 'Delete' });
      await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

      workerState.instance!.onmessage({ data: { success: false, error: 'nope' } });

      await expect(promise).rejects.toThrow('nope');
      expect(Object.keys(localStorage)).toHaveLength(3);
    });

    it('does not touch settings when adding', async () => {
      const promise = mutationGroups({ Group: ['Group C'], Handle: directory(folders), Action: 'Add' });
      await vi.waitFor(() => expect(workerState.instance).not.toBeNull());

      workerState.instance!.onmessage({ data: { success: true, data: ['Group C'] } });
      await promise;

      expect(Object.keys(localStorage)).toHaveLength(3);
    });
  });
});
