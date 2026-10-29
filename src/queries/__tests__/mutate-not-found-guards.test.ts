import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  queryResult: undefined as unknown,
  workers: [] as Array<{ onmessage: any; onerror: any; postMessage: any }>,
}));

vi.mock('@/App', () => ({
  queryClient: { query: vi.fn(async () => state.queryResult) },
}));

vi.mock('@/workers/mutations/file-query-mutate-worker.ts?worker', () => ({
  default: class {
    onmessage: any;
    onerror: any;
    postMessage = vi.fn();
    constructor() {
      state.workers.push(this as any);
    }
  },
}));

import { mutationConditions } from '../conditions/mutate-conditions';
import { mutationEvaluations } from '../evaluations/mutate-evaluations';
import { mutationIndividuals } from '../individuals/mutate-individuals';
import { mutationSettingsOutcomes } from '../outcomes/mutate-session-outcomes';
import { mutationGroups } from '../groups/mutate-groups';
import { mutationKeyboards } from '../keysets/mutate-keyboards';

const handle = {} as FileSystemDirectoryHandle;

describe('not-found guards', () => {
  beforeEach(() => {
    state.workers.length = 0;
    state.queryResult = undefined;
  });

  it('mutationGroups throws before reaching the worker when groups are missing', async () => {
    await expect(mutationGroups({ Group: ['A'], Handle: handle, Action: 'Add' })).rejects.toThrow('Groups not found');
    expect(state.workers).toHaveLength(0);
  });

  it('mutationConditions throws before reaching the worker when conditions are missing', async () => {
    await expect(
      mutationConditions({
        Group: 'G',
        Individual: 'I',
        Evaluation: 'E',
        Condition: 'C',
        Handle: handle,
        Action: 'Add',
      }),
    ).rejects.toThrow('Conditions not found');
    expect(state.workers).toHaveLength(0);
  });

  it('mutationEvaluations throws before reaching the worker when evaluations are missing', async () => {
    await expect(
      mutationEvaluations({ Group: 'G', Individual: 'I', Evaluations: ['E'], Handle: handle, Action: 'Add' }),
    ).rejects.toThrow('Evaluations not found');
    expect(state.workers).toHaveLength(0);
  });

  it('mutationIndividuals throws before reaching the worker when individuals are missing', async () => {
    await expect(
      mutationIndividuals({ Group: 'G', Individuals: ['I'], Handle: handle, Action: 'Add' }),
    ).rejects.toThrow('Individuals not found');
    expect(state.workers).toHaveLength(0);
  });

  it('mutationSettingsOutcomes throws before reaching the worker when outcomes are missing', async () => {
    await expect(
      mutationSettingsOutcomes({ Group: 'G', Individual: 'I', Evaluation: 'E', Handle: handle, Action: 'Delete' }),
    ).rejects.toThrow('Outcomes not found');
    expect(state.workers).toHaveLength(0);
  });
});

describe('guards pass through to the worker when data exists', () => {
  beforeEach(() => {
    state.workers.length = 0;
    state.queryResult = ['existing'];
  });

  it('mutationGroups forwards to the worker', async () => {
    const promise = mutationGroups({ Group: ['A'], Handle: handle, Action: 'Add' });
    await vi.waitFor(() => expect(state.workers).toHaveLength(1));
    state.workers[0].onmessage({ data: { success: true, data: ['A'] } });
    await expect(promise).resolves.toEqual(['A']);
  });

  it('mutationConditions forwards to the worker', async () => {
    const promise = mutationConditions({
      Group: 'G',
      Individual: 'I',
      Evaluation: 'E',
      Condition: 'C',
      Handle: handle,
      Action: 'Add',
    });
    await vi.waitFor(() => expect(state.workers).toHaveLength(1));
    state.workers[0].onmessage({ data: { success: true, data: ['C'] } });
    await expect(promise).resolves.toEqual(['C']);
  });

  it('mutationEvaluations forwards to the worker', async () => {
    const promise = mutationEvaluations({ Group: 'G', Individual: 'I', Evaluations: ['E'], Handle: handle, Action: 'Add' });
    await vi.waitFor(() => expect(state.workers).toHaveLength(1));
    state.workers[0].onmessage({ data: { success: true, data: ['E'] } });
    await expect(promise).resolves.toEqual(['E']);
  });

  it('mutationIndividuals forwards to the worker', async () => {
    const promise = mutationIndividuals({ Group: 'G', Individuals: ['I'], Handle: handle, Action: 'Add' });
    await vi.waitFor(() => expect(state.workers).toHaveLength(1));
    state.workers[0].onmessage({ data: { success: true, data: ['I'] } });
    await expect(promise).resolves.toEqual(['I']);
  });

  it('mutationSettingsOutcomes forwards to the worker', async () => {
    const promise = mutationSettingsOutcomes({ Group: 'G', Individual: 'I', Evaluation: 'E', Handle: handle, Action: 'Delete' });
    await vi.waitFor(() => expect(state.workers).toHaveLength(1));
    state.workers[0].onmessage({ data: { success: true, data: [] } });
    await expect(promise).resolves.toEqual([]);
  });
});

describe('mutationKeyboards', () => {
  beforeEach(() => {
    state.workers.length = 0;
  });

  it('sends the keyset mutation to the worker and resolves with its result', async () => {
    const promise = mutationKeyboards({
      Handle: handle,
      Group: 'G',
      Individual: 'I',
      Keysets: [],
      Action: 'Delete',
    });
    expect(state.workers).toHaveLength(1);
    expect(state.workers[0].postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ groupName: 'G', individualName: 'I' }),
    );
    state.workers[0].onmessage({ data: { success: true, data: [] } });
    await expect(promise).resolves.toEqual([]);
  });
});
