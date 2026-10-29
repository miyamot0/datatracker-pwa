import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const state = vi.hoisted(() => ({
  queryResult: undefined as unknown,
  mutateWorker: null as null | { onmessage: any; onerror: any; postMessage: any },
  deidentifyWorker: null as null | { onmessage: any; onerror: any; terminate: any },
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
      state.mutateWorker = this as any;
    }
  },
}));

vi.mock('@/workers/mutations/deidentify-individual-worker.ts?worker', () => ({
  default: class {
    onmessage: any;
    onerror: any;
    terminate = vi.fn();
    postMessage = vi.fn();
    constructor() {
      state.deidentifyWorker = this as any;
    }
  },
}));

import { mutationSettingsParams, mutationSessionParamsWorker } from '../session/mutate-session-params';
import { mutationEvaluationsAll, mutationEvaluationsAllWorker } from '../evaluations/mutate-evaluations-all';
import { mutateKeyboardsAll, mutateKeyboardsAllWorker } from '../keysets/mutate-keyboards-all';
import {
  mutationDeIdentifyIndividual,
  mutationDeIdentifyIndividualWorker,
} from '../individuals/mutate-deidentify-individual';
import { DEFAULT_SESSION_SETTINGS } from '@/lib/dtos/session-settings';

const handle = {} as FileSystemDirectoryHandle;

describe('mutationSessionParamsWorker', () => {
  beforeEach(() => {
    state.mutateWorker = null;
  });

  it('posts a MUTATE_SESSION_PARAMS request and resolves with the saved settings', async () => {
    const promise = mutationSessionParamsWorker({
      Group: 'G',
      Individual: 'I',
      Evaluation: 'E',
      Settings: DEFAULT_SESSION_SETTINGS,
      Handle: handle,
    });
    expect(state.mutateWorker!.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MUTATE_SESSION_PARAMS',
        groupName: 'G',
        individualName: 'I',
        evaluationName: 'E',
        settings: DEFAULT_SESSION_SETTINGS,
      }),
    );
    state.mutateWorker!.onmessage({ data: { success: true, data: DEFAULT_SESSION_SETTINGS } });
    await expect(promise).resolves.toEqual(DEFAULT_SESSION_SETTINGS);
  });

  it('rejects with the worker error on failure', async () => {
    const promise = mutationSessionParamsWorker({
      Group: 'G',
      Individual: 'I',
      Evaluation: 'E',
      Settings: DEFAULT_SESSION_SETTINGS,
      Handle: handle,
    });
    state.mutateWorker!.onmessage({ data: { success: false, error: 'bad', stack: 'trace' } });
    await expect(promise).rejects.toThrow('Worker error: bad\nStack: trace');
  });

  it('rejects when the worker errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const promise = mutationSessionParamsWorker({
      Group: 'G',
      Individual: 'I',
      Evaluation: 'E',
      Settings: DEFAULT_SESSION_SETTINGS,
      Handle: handle,
    });
    state.mutateWorker!.onerror({ message: 'crashed' });
    await expect(promise).rejects.toThrow('Worker error: crashed');
  });
});

describe('mutationSettingsParams', () => {
  beforeEach(() => {
    state.mutateWorker = null;
  });

  it('throws when the current settings are not found', async () => {
    state.queryResult = undefined;
    await expect(
      mutationSettingsParams({ Group: 'G', Individual: 'I', Evaluation: 'E', Settings: DEFAULT_SESSION_SETTINGS, Handle: handle }),
    ).rejects.toThrow('Settings not found');
    expect(state.mutateWorker).toBeNull();
  });

  it('delegates to the worker once settings are loaded', async () => {
    state.queryResult = DEFAULT_SESSION_SETTINGS;
    const promise = mutationSettingsParams({
      Group: 'G',
      Individual: 'I',
      Evaluation: 'E',
      Settings: DEFAULT_SESSION_SETTINGS,
      Handle: handle,
    });
    await vi.waitFor(() => expect(state.mutateWorker).not.toBeNull());
    state.mutateWorker!.onmessage({ data: { success: true, data: DEFAULT_SESSION_SETTINGS } });
    await expect(promise).resolves.toEqual(DEFAULT_SESSION_SETTINGS);
  });
});

describe('mutationEvaluationsAllWorker', () => {
  beforeEach(() => {
    state.mutateWorker = null;
  });

  it('posts a MUTATE_EVALUATIONS_ALL request and resolves with the records', async () => {
    const promise = mutationEvaluationsAllWorker({
      Group: 'G',
      Individual: 'I',
      AllRecords: [],
      RelevantRecords: [],
      Handle: handle,
      Action: 'Import',
    });
    expect(state.mutateWorker!.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'MUTATE_EVALUATIONS_ALL', action: 'Import' }),
    );
    state.mutateWorker!.onmessage({ data: { success: true, data: [{ id: 1 }] } });
    await expect(promise).resolves.toEqual([{ id: 1 }]);
  });

  it('rejects on worker failure and on worker error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failed = mutationEvaluationsAllWorker({
      Group: 'G',
      Individual: 'I',
      AllRecords: [],
      Handle: handle,
      Action: 'Import',
    });
    state.mutateWorker!.onmessage({ data: { success: false, error: 'nope', stack: 's' } });
    await expect(failed).rejects.toThrow('Worker error: nope');

    const errored = mutationEvaluationsAllWorker({
      Group: 'G',
      Individual: 'I',
      AllRecords: [],
      Handle: handle,
      Action: 'Import',
    });
    state.mutateWorker!.onerror({ message: 'down' });
    await expect(errored).rejects.toThrow('Worker error: down');
  });
});

describe('mutationEvaluationsAll', () => {
  beforeEach(() => {
    state.mutateWorker = null;
  });

  it('throws when the evaluations cannot be loaded', async () => {
    state.queryResult = undefined;
    await expect(
      mutationEvaluationsAll({ Group: 'G', Individual: 'I', Handle: handle, Action: 'Import' }),
    ).rejects.toThrow('Evaluations not found');
  });

  it('passes the loaded records to the worker', async () => {
    state.queryResult = [{ id: 'existing' }];
    const promise = mutationEvaluationsAll({ Group: 'G', Individual: 'I', Handle: handle, Action: 'Import' });
    await vi.waitFor(() => expect(state.mutateWorker).not.toBeNull());
    expect(state.mutateWorker!.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ allRecords: [{ id: 'existing' }] }),
    );
    state.mutateWorker!.onmessage({ data: { success: true, data: [] } });
    await expect(promise).resolves.toEqual([]);
  });
});

describe('mutateKeyboardsAllWorker', () => {
  beforeEach(() => {
    state.mutateWorker = null;
  });

  it('posts a MUTATE_KEYSETS_ALL request and resolves with the keysets', async () => {
    const promise = mutateKeyboardsAllWorker({
      Handle: handle,
      Group: 'G',
      Individual: 'I',
      KeySets: [],
      AllKeySets: [],
    });
    expect(state.mutateWorker!.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'MUTATE_KEYSETS_ALL', groupName: 'G', individualName: 'I' }),
    );
    state.mutateWorker!.onmessage({ data: { success: true, data: [{ name: 'k' }] } });
    await expect(promise).resolves.toEqual([{ name: 'k' }]);
  });

  it('rejects on worker failure and on worker error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failed = mutateKeyboardsAllWorker({ Handle: handle, Group: 'G', Individual: 'I', KeySets: [], AllKeySets: [] });
    state.mutateWorker!.onmessage({ data: { success: false, error: 'fail', stack: 's' } });
    await expect(failed).rejects.toThrow('Worker error: fail');

    const errored = mutateKeyboardsAllWorker({ Handle: handle, Group: 'G', Individual: 'I', KeySets: [], AllKeySets: [] });
    state.mutateWorker!.onerror({ message: 'gone' });
    await expect(errored).rejects.toThrow('Worker error: gone');
  });
});

describe('mutateKeyboardsAll', () => {
  beforeEach(() => {
    state.mutateWorker = null;
  });

  it('loads existing keysets and forwards them to the worker', async () => {
    state.queryResult = [{ name: 'existing' }];
    const promise = mutateKeyboardsAll({ Handle: handle, Group: 'G', Individual: 'I', KeySets: [] });
    await vi.waitFor(() => expect(state.mutateWorker).not.toBeNull());
    expect(state.mutateWorker!.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ allKeySets: [{ name: 'existing' }] }),
    );
    state.mutateWorker!.onmessage({ data: { success: true, data: [] } });
    await expect(promise).resolves.toEqual([]);
  });
});

describe('mutationDeIdentifyIndividualWorker', () => {
  const args = {
    Handle: handle,
    Group: 'G',
    SourceIndividual: 'Old',
    NewIndividual: 'New',
    ReplacementYear: 2020,
    RedactComments: true,
  };

  beforeEach(() => {
    state.deidentifyWorker = null;
  });

  it('resolves with the response data and terminates the worker', async () => {
    const promise = mutationDeIdentifyIndividualWorker(args);
    const worker = state.deidentifyWorker!;
    worker.onmessage({ data: { success: true, data: ['New'] } });
    await expect(promise).resolves.toEqual(['New']);
    expect(worker.terminate).toHaveBeenCalled();
  });

  it('rejects with the response error and terminates the worker', async () => {
    const promise = mutationDeIdentifyIndividualWorker(args);
    const worker = state.deidentifyWorker!;
    worker.onmessage({ data: { success: false, error: 'cannot de-identify' } });
    await expect(promise).rejects.toThrow('cannot de-identify');
    expect(worker.terminate).toHaveBeenCalled();
  });

  it('rejects with a generic message and terminates on worker error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const promise = mutationDeIdentifyIndividualWorker(args);
    const worker = state.deidentifyWorker!;
    worker.onerror({ message: 'x' });
    await expect(promise).rejects.toThrow('An unexpected worker error occurred while de-identifying the individual.');
    expect(worker.terminate).toHaveBeenCalled();
  });
});

describe('mutationDeIdentifyIndividual', () => {
  const args = {
    Handle: handle,
    Group: 'G',
    SourceIndividual: 'Old',
    NewIndividual: 'New',
    ReplacementYear: 2020,
    RedactComments: false,
  };

  beforeEach(() => {
    state.deidentifyWorker = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when the individuals cannot be loaded', async () => {
    state.queryResult = undefined;
    await expect(mutationDeIdentifyIndividual(args)).rejects.toThrow('Individuals not found');
    expect(state.deidentifyWorker).toBeNull();
  });

  it('runs the de-identify worker once individuals are loaded', async () => {
    state.queryResult = ['Old'];
    const promise = mutationDeIdentifyIndividual(args);
    await vi.waitFor(() => expect(state.deidentifyWorker).not.toBeNull());
    state.deidentifyWorker!.onmessage({ data: { success: true, data: ['New'] } });
    await expect(promise).resolves.toEqual(['New']);
  });
});

afterEach(() => {
  vi.clearAllMocks();
});
