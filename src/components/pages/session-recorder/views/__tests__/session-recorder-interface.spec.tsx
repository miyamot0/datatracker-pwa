// @ts-nocheck
import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockQuerySetData = vi.hoisted(() => vi.fn());
const mockQueryInvalidate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockRouter = vi.hoisted(() => ({
  history: { go: vi.fn() },
  options: {},
  invalidate: vi.fn().mockResolvedValue(undefined),
}));

const mutationConfigs = vi.hoisted(() => [] as any[]);
const mutationFns = vi.hoisted(() => [] as any[]);

const workerInstances = vi.hoisted(() => [] as any[]);
const messageChannels = vi.hoisted(() => [] as any[]);

const mockUseEventListener = vi.hoisted(() => vi.fn());
const mockSessionProcessKeypress = vi.hoisted(() => vi.fn());
const mockHandleMessageChannel = vi.hoisted(() => vi.fn());
const mockHandleWorkerMessage = vi.hoisted(() => vi.fn());
const mockFormatTimeOfDay = vi.hoisted(() => vi.fn(() => '12:00:00'));

// ----- Module mocks -----

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: mockQuerySetData,
    invalidateQueries: mockQueryInvalidate,
    setDefaultOptions: vi.fn(),
  },
}));

vi.mock('@tanstack/react-router', () => ({
  useRouter: vi.fn(() => mockRouter),
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn((config: any) => {
    mutationConfigs.push(config);
    const mutateAsync = vi.fn(async (payload: unknown) => {
      if (config.onSuccess) {
        await config.onSuccess([{ id: 'ok' }]);
      }
      return payload;
    });
    mutationFns.push(mutateAsync);
    return {
      mutateAsync,
      isPending: false,
    };
  }),
}));

vi.mock('@/workers/timing/session-recorder-worker.ts?worker', () => ({
  default: class {
    postMessage = vi.fn();
    terminate = vi.fn();
    onmessage = null;
    addEventListener = vi.fn();
    removeEventListener = vi.fn();

    constructor() {
      workerInstances.push(this);
    }
  },
}));

vi.mock('@/components/elements/behavior/event-listeners', () => ({
  useEventListener: mockUseEventListener,
}));

vi.mock('@/lib/session-keypress', () => ({
  SessionProcessKeypress: mockSessionProcessKeypress,
  handleMessageChannel: mockHandleMessageChannel,
  handleWorkerMessage: mockHandleWorkerMessage,
}));

vi.mock('@/lib/notifications', () => ({
  displayConditionalNotification: vi.fn(),
}));

vi.mock('@/lib/time', () => ({
  formatTimeOfDay: mockFormatTimeOfDay,
}));

vi.mock('@/queries/session/mutate-session-params', () => ({
  mutationSettingsParams: vi.fn(),
}));

vi.mock('@/queries/outcomes/mutate-session-outcomes', () => ({
  mutationSettingsOutcomes: vi.fn(),
}));

vi.mock('../ui-instructions', () => ({
  default: () => <div data-testid="session-instructions">Instructions</div>,
}));

vi.mock('../ui-key-listing', () => ({
  default: () => <div data-testid="key-listing">Key Listing</div>,
}));

vi.mock('../ui-counts-frequency', () => ({
  default: () => <div data-testid="frequency-tallies">Frequency</div>,
}));

vi.mock('../ui-counts-duration', () => ({
  default: () => <div data-testid="duration-tallies">Duration</div>,
}));

vi.mock('../../subpanels/header-component', () => ({
  default: () => <div data-testid="header-component">Header</div>,
}));

import SessionRecorderInterface from '../session-recorder-interface';

const makeKeyset = (override: Record<string, unknown> = {}) =>
  ({
    id: 'ks1',
    Name: 'TestSet',
    FrequencyKeys: [{ KeyName: 'F', KeyDescription: 'Freq', KeyCode: 70 }],
    DurationKeys: [{ KeyName: 'D', KeyDescription: 'Dur', KeyCode: 68 }],
    DerivedKeys: [],
    SpecialDurationKeys: [{ KeyName: 'S', KeyDescription: 'Special', KeyCode: 83 }],
    ScorableDurationKeys: [{ KeyName: 'C', KeyDescription: 'Scored', KeyCode: 67 }],
    ...override,
  }) as any;

const makeSettings = () =>
  ({
    Condition: 'Baseline',
    Session: 1,
    TimerOption: 'End on Timer #1',
    Initials: 'JD',
    Role: 'Primary',
    DurationS: 600,
    KeySet: 'TestSet',
    Therapist: 'Dr. Smith',
  }) as any;

const makeAppSettings = (override: Record<string, unknown> = {}) =>
  ({
    RecorderPolling: 'normal',
    KeyDisplay: 'standard',
    DisplaySize: 'standard',
    TimerTwoDisplay: 'hide',
    TimerThreeDisplay: 'hide',
    NotificationSettings: 'ShowAll',
    EnableToolTip: true,
    ...override,
  }) as any;

const makeHandle = () => ({}) as FileSystemDirectoryHandle;

const buildProps = (override: Record<string, unknown> = {}) => ({
  Group: 'GroupA',
  Individual: 'ClientB',
  Evaluation: 'Eval1',
  Keyset: makeKeyset(),
  Settings: makeSettings(),
  Handle: makeHandle(),
  ApplicationSettings: makeAppSettings(),
  ...override,
});

const getRecorderChannelFromWorker = (worker: any) => {
  const setupCall = worker.postMessage.mock.calls.find((call: any[]) => call[0]?.type === 'SETUP_CHANNEL');
  const transferredPort = setupCall?.[1]?.[0];
  return messageChannels.find((channel: any) => channel.port2 === transferredPort);
};

describe('SessionRecorderInterface', () => {
  beforeEach(() => {
    workerInstances.length = 0;
    messageChannels.length = 0;
    mutationConfigs.length = 0;
    mutationFns.length = 0;

    mockQuerySetData.mockReset();
    mockQueryInvalidate.mockReset();
    mockRouter.invalidate.mockReset();
    mockUseEventListener.mockReset();
    mockSessionProcessKeypress.mockReset();
    mockHandleMessageChannel.mockReset();
    mockHandleWorkerMessage.mockReset();
    mockFormatTimeOfDay.mockReset();
    mockFormatTimeOfDay.mockReturnValue('12:00:00');

    vi.stubGlobal(
      'MessageChannel',
      class {
        private dispatch = (data: unknown) => {
          setTimeout(() => {
            this.port1.onmessage?.({ data } as MessageEvent<any>);
          }, 0);
        };

        port1 = {
          onmessage: null as ((event: MessageEvent<any>) => void) | null,
          close: vi.fn(),
          start: vi.fn(),
        };
        port2 = {
          postMessage: vi.fn((data: unknown) => this.dispatch(data)),
          close: vi.fn(),
          start: vi.fn(),
        } as unknown as MessagePort;

        constructor() {
          messageChannels.push(this);
        }
      } as any,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders core interface sections and key history headers', async () => {
    await render(<SessionRecorderInterface {...buildProps()} />);

    await expect.element(page.getByTestId('header-component')).toBeInTheDocument();
    await expect.element(page.getByTestId('frequency-tallies')).toBeInTheDocument();
    await expect.element(page.getByTestId('duration-tallies')).toBeInTheDocument();
    await expect.element(page.getByTestId('session-instructions')).toBeInTheDocument();
    await expect.element(page.getByTestId('key-listing')).toBeInTheDocument();
    await expect.element(page.getByText('Session Measurements')).toBeInTheDocument();
    await expect.element(page.getByText('Key', { exact: true }).first()).toBeInTheDocument();
    await expect.element(page.getByText('Description')).toBeInTheDocument();
    await expect.element(page.getByText('Schedule')).toBeInTheDocument();
    await expect.element(page.getByText('Time')).toBeInTheDocument();
  });

  it('initializes worker, sets channel handlers, and posts setup/init messages', async () => {
    await render(<SessionRecorderInterface {...buildProps()} />);

    expect(workerInstances).toHaveLength(1);

    const worker = workerInstances[0];
    const channel = getRecorderChannelFromWorker(worker);
    expect(channel).toBeDefined();

    expect(worker.postMessage).toHaveBeenCalledTimes(2);
    expect(worker.postMessage.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        type: 'SETUP_CHANNEL',
      }),
    );
    expect(worker.postMessage.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        type: 'INIT',
        payload: expect.objectContaining({ uiPollingInterval: 'normal' }),
      }),
    );

    channel.port1.onmessage?.({ data: { type: 'TIMER_UPDATE' } } as MessageEvent<any>);
    expect(mockHandleMessageChannel).toHaveBeenCalled();

    worker.onmessage?.({ data: { type: 'SESSION_EVENT' } } as MessageEvent<any>);
    expect(mockHandleWorkerMessage).toHaveBeenCalled();
  });

  it('invokes SessionProcessKeypress through keydown event listener', async () => {
    await render(<SessionRecorderInterface {...buildProps()} />);

    expect(mockUseEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    const keydownHandler = mockUseEventListener.mock.calls[0][1];
    const event = { key: 'a', preventDefault: vi.fn() } as any;

    keydownHandler(event);

    expect(mockSessionProcessKeypress).toHaveBeenCalledWith(
      event,
      expect.objectContaining({
        runningState: 'Not Started',
        workerRef: expect.any(Object),
        ApplicationSettings: expect.any(Object),
      }),
    );
  });

  it('processes worker message path, triggers mutations, and renders key history rows', async () => {
    mockHandleWorkerMessage.mockImplementation((_event: any, ctx: any) => {
      ctx.setRunningState('Started');
      ctx.setStartTime(new Date('2024-01-01T00:00:00.000Z'));
      ctx.setKeysPressed([
        {
          KeyType: 'Duration',
          KeyCode: 68,
          KeyName: 'D',
          KeyDescription: 'Dur',
          KeyScheduleRecording: 'Continuous',
          TimePressed: new Date('2024-01-01T00:00:01.000Z'),
          TimeIntoSession: 1.23,
        },
      ]);

      void ctx.mutateSessionOutcomes.mutateAsync({});
      void ctx.mutateSettings.mutateAsync({});
    });

    await render(<SessionRecorderInterface {...buildProps()} />);
    const worker = workerInstances[0];
    worker.onmessage?.({ data: { type: 'WORKER' } } as MessageEvent<any>);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockQuerySetData).toHaveBeenCalledWith(['/', 'GroupA', 'ClientB', 'Eval1', 'outcomes'], [{ id: 'ok' }]);
    expect(mockQuerySetData).toHaveBeenCalledWith(['/', 'GroupA', 'ClientB', 'Eval1', 'settings'], [{ id: 'ok' }]);
    expect(mockRouter.invalidate).toHaveBeenCalled();

    const invalidateArg = mockRouter.invalidate.mock.calls[0][0];
    expect(invalidateArg.sync).toBe(false);
    expect(invalidateArg.filter({ routeId: '/session/$group/$individual/$evaluation/history/' })).toBe(true);
    expect(invalidateArg.filter({ routeId: '/session/$group/$individual/$evaluation/proportion' })).toBe(true);
    expect(invalidateArg.filter({ routeId: '/session/$group/$individual/$evaluation/rate' })).toBe(true);
    expect(invalidateArg.filter({ routeId: '/session/$group/$individual/$evaluation/reli' })).toBe(true);
    expect(invalidateArg.filter({ routeId: '/session/$group/$individual/$evaluation/view' })).toBe(true);
    expect(invalidateArg.filter({ routeId: '/other' })).toBe(false);

    await expect.element(page.getByRole('cell', { name: 'D', exact: true })).toBeInTheDocument();
    expect(mockFormatTimeOfDay).toHaveBeenCalled();
  });

  it('covers UI polling fallback and active-duration interval update path', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval').mockImplementation((fn: any, _ms?: any) => {
      fn();
      return 1 as any;
    });
    const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(1234567890);

    mockHandleWorkerMessage.mockImplementation((_event: any, ctx: any) => {
      ctx.setRunningState('Started');
      ctx.setKeysPressed([
        {
          KeyType: 'Duration',
          KeyCode: 68,
          KeyName: 'D',
          KeyDescription: 'Dur',
          KeyScheduleRecording: 'Continuous',
          TimePressed: new Date('2024-01-01T00:00:01.000Z'),
          TimeIntoSession: 1.23,
        },
      ]);
    });

    const appSettings = makeAppSettings({ RecorderPolling: 'unknown' as any });
    await render(<SessionRecorderInterface {...buildProps({ ApplicationSettings: appSettings })} />);

    const worker = workerInstances[0];
    worker.onmessage?.({ data: { type: 'RUNNING' } } as MessageEvent<any>);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 100);
    expect(dateNowSpy).toHaveBeenCalled();
    dateNowSpy.mockRestore();
  });

  it('covers scheduleUIUpdate throttle and applies pending timer updates', async () => {
    const raf = vi
      .fn()
      .mockImplementationOnce((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      })
      .mockImplementationOnce((cb: FrameRequestCallback) => {
        cb(20);
        return 2;
      });
    vi.stubGlobal('requestAnimationFrame', raf as any);

    mockHandleMessageChannel.mockImplementation((_event: any, ctx: any) => {
      ctx.pendingTimerUpdate.current = {
        total: 1,
        first: 1,
        second: 0,
        third: 0,
        active: 1,
        activeTimer: 'Primary',
      };
      ctx.scheduleUIUpdate();
    });

    await render(<SessionRecorderInterface {...buildProps()} />);

    const channel = getRecorderChannelFromWorker(workerInstances[0]);
    expect(channel).toBeDefined();
    channel.port1.onmessage?.({ data: { type: 'TIMER_UPDATE' } } as MessageEvent<any>);

    expect(raf).toHaveBeenCalledTimes(2);
  });

  it('returns early when scheduleUIUpdate is called while a frame is already pending', async () => {
    const raf = vi.fn(() => 99);
    vi.stubGlobal('requestAnimationFrame', raf as any);

    mockHandleMessageChannel.mockImplementation((_event: any, ctx: any) => {
      ctx.pendingTimerUpdate.current = {
        total: 1,
        first: 1,
        second: 0,
        third: 0,
        active: 1,
        activeTimer: 'Primary',
      };
      ctx.scheduleUIUpdate();
      ctx.scheduleUIUpdate();
    });

    await render(<SessionRecorderInterface {...buildProps()} />);
    const worker = workerInstances[0];
    const channel = getRecorderChannelFromWorker(worker);
    expect(channel).toBeDefined();

    channel.port1.onmessage?.({ data: { type: 'TIMER_UPDATE' } } as MessageEvent<any>);

    // First call schedules a frame, second call hits the early return path.
    expect(raf).toHaveBeenCalledTimes(1);
  });

  it('applies pending timer update on a single valid animation frame', async () => {
    const raf = vi.fn((cb: FrameRequestCallback) => {
      cb(20);
      return 1;
    });
    vi.stubGlobal('requestAnimationFrame', raf as any);

    mockHandleMessageChannel.mockImplementation((_event: any, ctx: any) => {
      ctx.pendingTimerUpdate.current = {
        total: 2,
        first: 1,
        second: 1,
        third: 0,
        active: 1,
        activeTimer: 'Primary',
      };
      ctx.scheduleUIUpdate();
    });

    await render(<SessionRecorderInterface {...buildProps()} />);
    const worker = workerInstances[0];
    const channel = getRecorderChannelFromWorker(worker);
    expect(channel).toBeDefined();

    channel.port1.onmessage?.({ data: { type: 'TIMER_UPDATE' } } as MessageEvent<any>);
    expect(raf).toHaveBeenCalledTimes(1);
  });

  it('handles animation frame with no pending timer update', async () => {
    const raf = vi.fn((cb: FrameRequestCallback) => {
      cb(20);
      return 1;
    });
    vi.stubGlobal('requestAnimationFrame', raf as any);

    mockHandleMessageChannel.mockImplementation((_event: any, ctx: any) => {
      // Intentionally do not set pendingTimerUpdate.current to cover the false branch.
      ctx.scheduleUIUpdate();
    });

    await render(<SessionRecorderInterface {...buildProps()} />);
    const worker = workerInstances[0];
    const channel = getRecorderChannelFromWorker(worker);
    expect(channel).toBeDefined();

    channel.port1.onmessage?.({ data: { type: 'TIMER_UPDATE' } } as MessageEvent<any>);
    expect(raf).toHaveBeenCalledTimes(1);
  });

  it('cleans up worker, channel, animation frame, and wake lock on unmount', async () => {
    const wakeRelease = vi.fn().mockResolvedValue(undefined);
    const cancelAnimationFrameMock = vi.fn();

    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 42) as any);
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrameMock as any);

    mockHandleMessageChannel.mockImplementation((_event: any, ctx: any) => {
      ctx.pendingTimerUpdate.current = {
        total: 1,
        first: 1,
        second: 0,
        third: 0,
        active: 1,
        activeTimer: 'Primary',
      };
      ctx.scheduleUIUpdate();
    });

    mockHandleWorkerMessage.mockImplementation((_event: any, ctx: any) => {
      ctx.wakelockRef.current = {
        release: wakeRelease,
      };
    });

    const view = await render(<SessionRecorderInterface {...buildProps()} />);

    const worker = workerInstances[workerInstances.length - 1];
    const channel = getRecorderChannelFromWorker(worker);
    expect(channel).toBeDefined();

    channel.port1.onmessage?.({ data: { type: 'TIMER_UPDATE' } } as MessageEvent<any>);
    worker.onmessage?.({ data: { type: 'SET_WAKE' } } as MessageEvent<any>);

    view.unmount();

    expect(cancelAnimationFrameMock).toHaveBeenCalledWith(42);
    expect(channel.port1.close).toHaveBeenCalled();
    expect(worker.terminate).toHaveBeenCalled();
    expect(wakeRelease).toHaveBeenCalled();
  });
});
