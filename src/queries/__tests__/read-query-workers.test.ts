import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const workers = vi.hoisted(() => ({
  instances: [] as Array<{ onmessage: any; onerror: any; posted: any[] }>,
}));

vi.mock('@/workers/queries/file-query-read-worker.ts?worker', () => ({
  default: class {
    onmessage: any;
    onerror: any;
    posted: any[] = [];
    postMessage(req: any) {
      this.posted.push(req);
    }
    constructor() {
      workers.instances.push(this as any);
    }
  },
}));

import { groupQueryOptions, fetchGroupsWorker } from '../groups/query-groups';
import { clientQueryOptions, fetchIndividualsWorker } from '../individuals/query-individuals';
import { conditionQueryOptions, fetchConditionsWorker } from '../conditions/query-conditions';
import { evaluationQueryOptions, fetchEvaluationsWorker } from '../evaluations/query-evaluations';
import { evaluationsAllQueryOptions, fetchEvaluationsAllWorker } from '../evaluations/query-evaluations-all';
import { keyboardQueryOptions, fetchKeyboardsWorker } from '../keysets/query-keyboards';
import { keyboardsAllQueryOptions, fetchKeyboardsAllWorker } from '../keysets/query-keyboards-all';
import { sessionOutcomesQueryOptions, fetchSessionOutcomesWorker } from '../outcomes/query-session-outcomes';
import { sessionQueryOptions, fetchSessionParamsWorker } from '../session/query-session-params';
import { DEFAULT_SESSION_SETTINGS } from '@/lib/dtos/session-settings';

const handle = {} as FileSystemDirectoryHandle;

const lastWorker = () => workers.instances[workers.instances.length - 1];

// Each fetcher posts one request and resolves from the worker's response.
const fetchers: Array<{
  name: string;
  run: () => Promise<unknown>;
  type: string;
  fallback: unknown;
}> = [
  { name: 'groups', run: () => fetchGroupsWorker(handle), type: 'FETCH_GROUPS', fallback: [] },
  { name: 'individuals', run: () => fetchIndividualsWorker(handle, 'G'), type: 'FETCH_CLIENTS', fallback: [] },
  { name: 'conditions', run: () => fetchConditionsWorker(handle, 'G', 'I', 'E'), type: 'FETCH_CONDITIONS', fallback: [] },
  { name: 'evaluations', run: () => fetchEvaluationsWorker(handle, 'G', 'I'), type: 'FETCH_EVALUATIONS', fallback: [] },
  { name: 'evaluations all', run: () => fetchEvaluationsAllWorker(handle), type: 'FETCH_EVALUATIONS_ALL', fallback: [] },
  { name: 'keyboards', run: () => fetchKeyboardsWorker(handle, 'G', 'I'), type: 'FETCH_KEYSETS', fallback: [] },
  { name: 'keyboards all', run: () => fetchKeyboardsAllWorker(handle, 'G', 'I'), type: 'FETCH_KEYSETS_ALL', fallback: [] },
  { name: 'session outcomes', run: () => fetchSessionOutcomesWorker(handle, 'G', 'I', 'E'), type: 'FETCH_OUTCOMES', fallback: [] },
  {
    name: 'session params',
    run: () => fetchSessionParamsWorker(handle, 'G', 'I', 'E'),
    type: 'FETCH_SESSION_PARAMS',
    fallback: DEFAULT_SESSION_SETTINGS,
  },
];

describe('read query workers', () => {
  beforeEach(() => {
    workers.instances.length = 0;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(fetchers)('$name posts a request of type $type with the handle', async ({ run, type }) => {
    const promise = run();
    const worker = lastWorker();
    expect(worker.posted[0]).toMatchObject({ type, handle });
    expect(typeof worker.posted[0].id).toBe('string');
    worker.onmessage({ data: { success: true, data: [] } });
    await promise;
  });

  it.each(fetchers)('$name resolves with the worker data on success', async ({ run }) => {
    const promise = run();
    const payload = [{ value: 'sample' }];
    lastWorker().onmessage({ data: { success: true, data: payload } });
    await expect(promise).resolves.toEqual(payload);
  });

  it.each(fetchers)('$name resolves with its fallback when the worker reports failure', async ({ run, fallback }) => {
    const promise = run();
    lastWorker().onmessage({ data: { success: false, error: 'nope' } });
    await expect(promise).resolves.toEqual(fallback);
  });

  it.each(fetchers)('$name resolves with its fallback when the worker errors', async ({ run, fallback }) => {
    const promise = run();
    lastWorker().onerror({ message: 'boom' });
    await expect(promise).resolves.toEqual(fallback);
    expect(console.error).toHaveBeenCalledWith('Worker error:', { message: 'boom' });
  });
});

describe('query option factories', () => {
  it('build stable query keys and static stale time', () => {
    expect(groupQueryOptions(handle).queryKey).toEqual(['/']);
    expect(clientQueryOptions(handle, 'G').queryKey).toEqual(['/', 'G']);
    expect(conditionQueryOptions(handle, 'G', 'I', 'E').queryKey).toEqual(['/', 'G', 'I', 'E', 'conditions']);
    expect(evaluationQueryOptions(handle, 'G', 'I').queryKey).toEqual(['/', 'G', 'I']);
    expect(evaluationsAllQueryOptions(handle).queryKey).toEqual(['/', 'metaEvaluations']);
    expect(keyboardQueryOptions(handle, 'G', 'I').queryKey).toEqual(['/', 'G', 'I', 'keyboards']);
    expect(keyboardsAllQueryOptions(handle, 'G', 'I').queryKey).toEqual(['/', 'G', 'metaKeyboards']);
    expect(sessionOutcomesQueryOptions(handle, 'G', 'I', 'E').queryKey).toEqual(['/', 'G', 'I', 'E', 'outcomes']);
    expect(sessionQueryOptions(handle, 'G', 'I', 'E').queryKey).toEqual(['/', 'G', 'I', 'E', 'settings']);
    expect(sessionQueryOptions(handle, 'G', 'I', 'E').staleTime).toBe('static');
  });

  it('wire queryFn to the matching worker fetcher', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    workers.instances.length = 0;
    void groupQueryOptions(handle).queryFn();
    void clientQueryOptions(handle, 'G').queryFn();
    void evaluationsAllQueryOptions(handle).queryFn();
    void evaluationQueryOptions(handle, 'G', 'I').queryFn();
    void keyboardQueryOptions(handle, 'G', 'I').queryFn();
    void keyboardsAllQueryOptions(handle, 'G', 'I').queryFn();
    void sessionOutcomesQueryOptions(handle, 'G', 'I', 'E').queryFn();
    expect(workers.instances).toHaveLength(7);
    void conditionQueryOptions(handle, 'G', 'I', 'E').queryFn();
    expect(lastWorker().posted[0]).toMatchObject({
      type: 'FETCH_CONDITIONS',
      groupName: 'G',
      individualName: 'I',
      evaluationName: 'E',
    });
    void sessionQueryOptions(handle, 'G', 'I', 'E').queryFn();
    expect(lastWorker().posted[0]).toMatchObject({ type: 'FETCH_SESSION_PARAMS', evaluationName: 'E' });
  });
});
