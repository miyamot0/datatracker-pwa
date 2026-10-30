import { cleanup, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings/application-settings';
import { Route as RouteModule } from '@/routes/session/$group/$individual/$evaluation/proportion';

const { useLoaderDataMock, visualsSpy, keyboardQueryOptionsMock, sessionOutcomesQueryOptionsMock, conditionQueryOptionsMock } =
  vi.hoisted(() => ({
    useLoaderDataMock: vi.fn(),
    visualsSpy: vi.fn(),
    keyboardQueryOptionsMock: vi.fn((...args: unknown[]) => ({ queryKey: ['keyboards'], args })),
    sessionOutcomesQueryOptionsMock: vi.fn((...args: unknown[]) => ({ queryKey: ['outcomes'], args })),
    conditionQueryOptionsMock: vi.fn((...args: unknown[]) => ({ queryKey: ['conditions'], args })),
  }));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  const React = await vi.importActual<typeof import('react')>('react');

  // Suspense wiring of tanstack's Await does not resume under jsdom, so resolve the promise in an effect instead.
  const Await = ({
    promise,
    fallback,
    children,
  }: {
    promise: Promise<unknown>;
    fallback: React.ReactNode;
    children: (data: unknown) => React.ReactNode;
  }) => {
    const [state, setState] = React.useState<{ data: unknown } | null>(null);
    React.useEffect(() => {
      let live = true;
      promise.then((data) => {
        if (live) setState({ data });
      });
      return () => {
        live = false;
      };
    }, [promise]);
    return state ? children(state.data) : fallback;
  };

  return {
    ...actual,
    Await,
    redirect: vi.fn((options: unknown) => ({ redirect: options })),
    createFileRoute: () => (options: Record<string, unknown>) => ({ options, useLoaderData: useLoaderDataMock }),
  };
});

vi.mock('@/queries/keysets/query-keyboards', () => ({ keyboardQueryOptions: keyboardQueryOptionsMock }));
vi.mock('@/queries/outcomes/query-session-outcomes', () => ({
  sessionOutcomesQueryOptions: sessionOutcomesQueryOptionsMock,
}));
vi.mock('@/queries/conditions/query-conditions', () => ({ conditionQueryOptions: conditionQueryOptionsMock }));

vi.mock('@/components/elements/page-wrapper', () => ({
  default: ({ children, label }: { children: ReactNode; label: string }) => (
    <div data-testid="page-wrapper" data-label={label}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/breadcrumb-entries', () => ({
  BuildGroupBreadcrumb: () => 'group-crumb',
  BuildIndividualsBreadcrumb: (group: string) => `individuals-${group}`,
  BuildEvaluationsBreadcrumb: (group: string, individual: string) => `evaluations-${group}-${individual}`,
}));

vi.mock('@/components/elements/suspense/loading-display', () => ({
  LoadingDisplay: () => <div data-testid="loading">loading</div>,
}));

vi.mock('@/components/pages/visualize-outcomes/proportion/results-proportion-visuals-page', () => ({
  default: (props: Record<string, unknown>) => {
    visualsSpy(props);
    return <div data-testid="visuals" />;
  },
}));

type Route = {
  options: {
    beforeLoad: (args: unknown) => Record<string, unknown>;
    loader: (args: unknown) => Promise<Record<string, unknown>>;
    component: () => ReactNode;
  };
  useLoaderData: typeof useLoaderDataMock;
};

const Route = RouteModule as unknown as Route;

const KEY = (code: string, description: string) => ({ KeyCode: code, KeyDescription: description });

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    Keyset: {
      Name: 'Session Keys',
      FrequencyKeys: [KEY('f1', 'Freq 1')],
      DurationKeys: [KEY('d1', 'Dur 1')],
      DerivedKeys: [],
      SpecialDurationKeys: [],
      ScorableDurationKeys: [],
    },
    SessionSettings: { Session: 1, Role: 'Primary', KeySet: 'Session Keys' },
    Filename: 'session-1.json',
    ...overrides,
  };
}

function makeContext(overrides: Record<string, unknown> = {}) {
  const query = vi.fn((options: { queryKey: string[] }) => {
    if (options.queryKey[0] === 'keyboards') return Promise.resolve([]);
    if (options.queryKey[0] === 'outcomes') return Promise.resolve([]);
    return Promise.resolve([]);
  });

  return {
    queryClient: { query },
    Group: 'G',
    Individual: 'I',
    Evaluation: 'E',
    CleanHandle: { name: 'handle' },
    Settings: DEFAULT_APPLICATION_SETTINGS,
    ...overrides,
  };
}

function loaderDataFrom(results: [unknown[], unknown[], string[]]) {
  return {
    Group: 'G',
    Individual: 'I',
    Evaluation: 'E',
    Handle: { name: 'handle' },
    Settings: DEFAULT_APPLICATION_SETTINGS,
    totalQuery: Promise.resolve(results),
  };
}

function lastVisualsProps(): Record<string, any> {
  const calls = visualsSpy.mock.calls;
  return calls[calls.length - 1][0];
}

describe('session proportion route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  describe('beforeLoad', () => {
    it('redirects to the dashboard when a route param is missing', () => {
      const beforeLoad = Route.options.beforeLoad;
      const context = makeContext({ folderHandleContext: { isInitialized: true, handle: {}, settings: {} } });

      try {
        beforeLoad({ context, params: { group: 'G', individual: '', evaluation: 'E' } });
        expect.fail('expected redirect');
      } catch (error) {
        expect(error).toEqual({ redirect: { to: '/dashboard' } });
      }
    });

    it('redirects to the root when folder context is not initialized', () => {
      const beforeLoad = Route.options.beforeLoad;

      try {
        beforeLoad({
          context: makeContext({ folderHandleContext: { isInitialized: false, handle: undefined, settings: {} } }),
          params: { group: 'G', individual: 'I', evaluation: 'E' },
        });
        expect.fail('expected redirect');
      } catch (error) {
        expect(error).toEqual({ redirect: { href: '/' } });
      }
    });

    it('returns cleaned route params along with the guarded handle and settings', () => {
      const handle = { name: 'handle' };
      const settings = { ...DEFAULT_APPLICATION_SETTINGS, DisplaySize: 'wide' };

      const result = Route.options.beforeLoad({
        context: makeContext({ folderHandleContext: { isInitialized: true, handle, settings } }),
        params: { group: 'Group%20A', individual: 'Ind%20B', evaluation: 'Eval%20C' },
      });

      expect(result).toEqual({
        Group: 'Group A',
        Individual: 'Ind B',
        Evaluation: 'Eval C',
        CleanHandle: handle,
        Settings: settings,
      });
    });

    it('throws when no handle is attached to an initialized context', () => {
      expect(() =>
        Route.options.beforeLoad({
          context: makeContext({ folderHandleContext: { isInitialized: true, handle: undefined, settings: {} } }),
          params: { group: 'G', individual: 'I', evaluation: 'E' },
        }),
      ).toThrow();
    });
  });

  describe('loader', () => {
    it('queries keyboards, outcomes, and conditions and returns them as a tracked total query', async () => {
      const context = makeContext();

      const data = await Route.options.loader({ context });

      expect(keyboardQueryOptionsMock).toHaveBeenCalledWith(context.CleanHandle, 'G', 'I');
      expect(sessionOutcomesQueryOptionsMock).toHaveBeenCalledWith(context.CleanHandle, 'G', 'I', 'E');
      expect(conditionQueryOptionsMock).toHaveBeenCalledWith(context.CleanHandle, 'G', 'I', 'E');
      expect(context.queryClient.query).toHaveBeenCalledTimes(3);

      expect(data).toMatchObject({
        Group: 'G',
        Individual: 'I',
        Evaluation: 'E',
        Handle: context.CleanHandle,
        Settings: context.Settings,
      });
      await expect(data.totalQuery).resolves.toEqual([[], [], []]);
    });
  });

  describe('component', () => {
    it('shows the loading fallback while the loader data is pending', () => {
      useLoaderDataMock.mockReturnValue({
        ...loaderDataFrom([[], [], []]),
        totalQuery: new Promise(() => {}),
      });

      render(<Route.options.component />);

      expect(screen.getByTestId('loading')).toBeTruthy();
      expect(visualsSpy).not.toHaveBeenCalled();
    });

    it('renders the page with a sanitized label and breadcrumbs', async () => {
      useLoaderDataMock.mockReturnValue(loaderDataFrom([[], [], []]));

      render(<Route.options.component />);

      await screen.findByTestId('visuals');
      const wrapper = screen.getByTestId('page-wrapper');
      expect(wrapper.getAttribute('data-label')).toBe('E: Interval Proportions');
    });

    it('falls back to empty defaults when there are no sessions or keyboards', async () => {
      useLoaderDataMock.mockReturnValue(loaderDataFrom([[], [], []]));

      render(<Route.options.component />);
      await screen.findByTestId('visuals');

      const props = lastVisualsProps();
      expect(props.ResultsFiltered).toEqual([]);
      expect(props.MinX).toBe(0);
      expect(props.MaxX).toBe(1);
      expect(props.DynamicKeySet).toMatchObject({
        Name: '',
        FrequencyKeys: [],
        DurationKeys: [],
        DerivedKeys: [],
        SpecialDurationKeys: [],
        ScorableDurationKeys: [],
      });
      expect(props.ShowKeys).toEqual([]);
      expect(props.Conditions).toEqual([]);
      expect(props.TimerMapping).toEqual(expect.objectContaining({ value: expect.any(String) }));
    });

    it('filters to primary sessions and computes the x-range from them', async () => {
      const primaryLate = makeSession({ SessionSettings: { Session: 5, Role: 'Primary', KeySet: 'Session Keys' } });
      const primaryEarly = makeSession({ SessionSettings: { Session: 2, Role: 'Primary', KeySet: 'Session Keys' } });
      const reli = makeSession({ SessionSettings: { Session: 9, Role: 'Reliability', KeySet: 'Session Keys' } });

      useLoaderDataMock.mockReturnValue(loaderDataFrom([[], [primaryLate, reli, primaryEarly], ['A', 'B']]));

      render(<Route.options.component />);
      await screen.findByTestId('visuals');

      const props = lastVisualsProps();
      expect(props.ResultsFiltered.map((r: any) => r.SessionSettings.Session)).toEqual([2, 5]);
      expect(props.MinX).toBe(2);
      expect(props.MaxX).toBe(5);
      expect(props.Results).toHaveLength(3);
      expect(props.Conditions).toEqual(['A', 'B']);
      expect(props.Group).toBe('G');
      expect(props.Individual).toBe('I');
      expect(props.Evaluation).toBe('E');
      expect(props.Handle).toEqual({ name: 'handle' });
    });

    it('uses the saved session keyset when the most recent session has one', async () => {
      const session = makeSession();
      useLoaderDataMock.mockReturnValue(loaderDataFrom([[], [session], []]));

      render(<Route.options.component />);
      await screen.findByTestId('visuals');

      const props = lastVisualsProps();
      expect(props.DynamicKeySet.Name).toBe('Session Keys');
      expect(props.DynamicKeySet.FrequencyKeys).toEqual([KEY('f1', 'Freq 1')]);
      expect(props.DynamicKeySet.DurationKeys).toEqual([KEY('d1', 'Dur 1')]);
      expect(props.ShowKeys).toEqual([expect.objectContaining({ KeyDescription: 'Dur 1', Visible: true, KeyType: 'Observed' })]);
    });



    it('merges keys from the designer keyset that matches the most recent session', async () => {
      const session = makeSession();
      const designer = {
        Name: 'Session Keys',
        FrequencyKeys: [KEY('f2', 'Freq 2')],
        DurationKeys: [KEY('d2', 'Dur 2')],
        DerivedKeys: [{ id: 'derived-1' }],
        SpecialDurationKeys: [KEY('s1', 'Special 1')],
        ScorableDurationKeys: [KEY('sc1', 'Score 1')],
      };
      useLoaderDataMock.mockReturnValue(loaderDataFrom([[designer, { Name: 'Other' }], [session], []]));

      render(<Route.options.component />);
      await screen.findByTestId('visuals');

      const props = lastVisualsProps();
      const freqCodes = props.DynamicKeySet.FrequencyKeys.map((k: any) => k.KeyCode);
      const durCodes = props.DynamicKeySet.DurationKeys.map((k: any) => k.KeyCode);
      expect(freqCodes).toEqual(['f1', 'f2']);
      expect(durCodes).toEqual(['d1', 'd2']);
      expect(props.DynamicKeySet.DerivedKeys).toEqual([{ id: 'derived-1' }]);
      expect(props.DynamicKeySet.SpecialDurationKeys.map((k: any) => k.KeyCode)).toEqual(['s1']);
      expect(props.DynamicKeySet.ScorableDurationKeys.map((k: any) => k.KeyCode)).toEqual(['sc1']);
      expect(props.ShowKeys.map((k: any) => k.KeyDescription)).toEqual(['Dur 1', 'Dur 2', 'Score 1']);
    });

    it('tolerates optional key arrays missing from the session and designer keysets', async () => {
      const session = makeSession({
        Keyset: { Name: 'Session Keys', FrequencyKeys: [], DurationKeys: [] },
      });
      const designer = { Name: 'Session Keys' };
      useLoaderDataMock.mockReturnValue(loaderDataFrom([[designer], [session], []]));

      render(<Route.options.component />);
      await screen.findByTestId('visuals');

      const props = lastVisualsProps();
      expect(props.DynamicKeySet.FrequencyKeys).toEqual([]);
      expect(props.DynamicKeySet.DerivedKeys).toEqual([]);
      expect(props.DynamicKeySet.SpecialDurationKeys).toEqual([]);
      expect(props.DynamicKeySet.ScorableDurationKeys).toEqual([]);
    });

    it('ignores designer keysets whose name does not match the most recent session', async () => {
      const session = makeSession({ SessionSettings: { Session: 1, Role: 'Primary', KeySet: 'Missing' } });
      const designer = {
        Name: 'Other',
        FrequencyKeys: [KEY('f9', 'Freq 9')],
        DurationKeys: [KEY('d9', 'Dur 9')],
        DerivedKeys: [],
        SpecialDurationKeys: [],
        ScorableDurationKeys: [],
      };
      useLoaderDataMock.mockReturnValue(loaderDataFrom([[designer], [session], []]));

      render(<Route.options.component />);
      await screen.findByTestId('visuals');

      const props = lastVisualsProps();
      expect(props.DynamicKeySet.FrequencyKeys.map((k: any) => k.KeyCode)).toEqual(['f1']);
      expect(props.DynamicKeySet.DurationKeys.map((k: any) => k.KeyCode)).toEqual(['d1']);
    });

    it('selects the stored schedule when it is among the available scoring options', async () => {
      localStorage.setItem(
        'G_I_E_Duration',
        JSON.stringify({ KeyDescription: ['Dur 1'], Schedule: 'End on Timer #1' }),
      );
      useLoaderDataMock.mockReturnValue(loaderDataFrom([[], [makeSession()], []]));

      render(<Route.options.component />);
      await screen.findByTestId('visuals');

      const props = lastVisualsProps();
      expect(props.TimerMapping.value).toBe('End on Timer #1');
      expect(props.ShowKeys.find((k: any) => k.KeyDescription === 'Dur 1').Visible).toBe(false);
    });

    it('falls back to the first scoring option when the stored schedule is unavailable', async () => {
      localStorage.setItem(
        'G_I_E_Duration',
        JSON.stringify({ KeyDescription: [], Schedule: 'End on Timer #3-not-real' }),
      );
      useLoaderDataMock.mockReturnValue(loaderDataFrom([[], [makeSession()], []]));

      render(<Route.options.component />);
      await screen.findByTestId('visuals');

      const props = lastVisualsProps();
      expect(props.TimerMapping).toBeDefined();
      expect(props.TimerMapping).toEqual(expect.objectContaining({ value: expect.any(String) }));
    });

    it('passes the application settings through to the visuals page', async () => {
      const settings = { ...DEFAULT_APPLICATION_SETTINGS, DisplaySize: 'wide' };
      useLoaderDataMock.mockReturnValue({ ...loaderDataFrom([[], [], []]), Settings: settings });

      render(<Route.options.component />);
      await screen.findByTestId('visuals');

      expect(lastVisualsProps().Settings).toBe(settings);
    });
  });
});
