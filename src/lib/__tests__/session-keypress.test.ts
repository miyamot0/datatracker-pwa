import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import {
  handleMessageChannel,
  handleWorkerMessage,
  handleSessionEnded,
  switchTimer,
  switchToSpecialKey,
  SessionProcessKeypress,
} from '../session-keypress';

vi.mock('sonner', () => ({ toast: vi.fn() }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const makeRef = <T>(value: T) => ({ current: value });

const makeKeyset = (overrides: Record<string, unknown> = {}): any => ({
  id: 'keyset-1',
  Name: 'Test Keyset',
  FrequencyKeys: [],
  DurationKeys: [],
  createdAt: new Date(),
  lastModified: new Date(),
  DerivedKeys: [],
  SpecialDurationKeys: [],
  ScorableDurationKeys: [],
  ...overrides,
});

const makeSettings = (overrides: Record<string, unknown> = {}): any => ({
  Therapist: 'Dr. Test',
  Condition: 'Baseline',
  KeySet: 'keyset-1',
  TimerOption: 'End on Timer #1',
  Initials: 'TT',
  Role: 'Primary',
  Session: 1,
  DurationS: 600,
  ...overrides,
});

const makeAppSettings = (overrides: Record<string, unknown> = {}): any => ({
  PostSessionBx: 'AwaitInput',
  NotificationSettings: 'ShowAll',
  EnableFileDeletion: false,
  EnforceDataFolderName: false,
  EnableToolTip: true,
  IsReturningUser: false,
  KeyDisplay: 'standard',
  DisplaySize: 'standard',
  CacheBehavior: 'normal',
  TransitionBehavior: 'none',
  RecorderPolling: 'normal',
  ApplicationFooterDisplay: 'Standard',
  SessionDisplay: 'Standard',
  TimerTwoDisplay: 'hide',
  TimerThreeDisplay: 'hide',
  ...overrides,
});

const makeHandle = () => ({}) as unknown as FileSystemDirectoryHandle;

const makeKey = (overrides: Record<string, unknown> = {}): any => ({
  KeyName: 'a',
  KeyCode: 65,
  KeyDescription: 'A key',
  KeyScheduleRecording: 'Primary',
  TimePressed: new Date(),
  TimeIntoSession: 0,
  KeyType: 'Frequency',
  ...overrides,
});

const makeTimerPayload = (overrides: Record<string, unknown> = {}): any => ({
  total: 100,
  first: 50,
  second: 25,
  third: 25,
  active: 50,
  activeTimer: 'Primary',
  specialKeyTimers: { SpecialKey: 10 },
  activeSpecialKey: null,
  ...overrides,
});

const makeSessionEndedPayload = (overrides: Record<string, unknown> = {}) => ({
  reason: 'Completed' as const,
  keysPressed: [] as any[],
  systemKeysPressed: [] as any[],
  timers: { total: 100, first: 50, second: 25, third: 25 },
  specialKeyTimers: {} as Record<string, number>,
  startTime: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const makeWorkerEvent = (type: string, payload?: unknown): MessageEvent<any> =>
  ({ data: { type, payload } }) as MessageEvent<any>;

const makeMutations = () => ({
  mutateSessionOutcomes: { mutateAsync: vi.fn().mockResolvedValue([]) } as any,
  mutateSettings: { mutateAsync: vi.fn().mockResolvedValue(makeSettings()) } as any,
});

const makeSessionEndedArgs = (overrides: Record<string, unknown> = {}) => {
  const { mutateSessionOutcomes, mutateSettings } = makeMutations();
  return {
    Group: 'Group1',
    Individual: 'Ind1',
    Evaluation: 'Eval1',
    Keyset: makeKeyset(),
    Settings: makeSettings(),
    Handle: makeHandle(),
    ApplicationSettings: makeAppSettings(),
    mutateSessionOutcomes,
    mutateSettings,
    history: { go: vi.fn() },
    displayConditionalNotification: vi.fn(),
    setRunningState: vi.fn(),
    setStartTime: vi.fn(),
    wakelockRef: makeRef<WakeLockSentinel | undefined>(undefined),
    endingProcessedRef: makeRef(false),
    ...overrides,
  };
};

const makeWorkerMessageArgs = (overrides: Record<string, unknown> = {}) => {
  const { mutateSessionOutcomes, mutateSettings } = makeMutations();
  return {
    Group: 'Group1',
    Individual: 'Ind1',
    Evaluation: 'Eval1',
    Keyset: makeKeyset(),
    Settings: makeSettings(),
    Handle: makeHandle(),
    ApplicationSettings: makeAppSettings(),
    mutateSessionOutcomes,
    mutateSettings,
    history: { go: vi.fn() },
    displayConditionalNotification: vi.fn(),
    setRunningState: vi.fn(),
    setStartTime: vi.fn(),
    wakelockRef: makeRef<WakeLockSentinel | undefined>(undefined),
    endingProcessedRef: makeRef(false),
    pendingTimerUpdate: makeRef<any>(null),
    specialKeyTimers: makeRef<Record<string, number>>({}),
    activeSpecialKey: makeRef<string | null>(null),
    scheduleUIUpdate: vi.fn(),
    setKeysPressed: vi.fn(),
    activeTimerRef: makeRef<any>('Primary'),
    ...overrides,
  };
};

const makeKeyEvent = (key: string, extra: Record<string, unknown> = {}): React.KeyboardEvent<HTMLElement> =>
  ({
    key,
    keyCode: key.length === 1 ? key.charCodeAt(0) : 0,
    repeat: false,
    preventDefault: vi.fn(),
    ...extra,
  }) as unknown as React.KeyboardEvent<HTMLElement>;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('session-keypress.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // handleMessageChannel
  // =========================================================================
  describe('handleMessageChannel', () => {
    const baseArgs = () => ({
      pendingTimerUpdate: makeRef<any>(null),
      specialKeyTimers: makeRef<Record<string, number>>({}),
      activeSpecialKey: makeRef<string | null>(null),
      scheduleUIUpdate: vi.fn(),
    });

    it('updates pendingTimerUpdate when HIGH_FREQ_UPDATE fires', () => {
      const args = baseArgs();
      const payload = makeTimerPayload();
      handleMessageChannel(makeWorkerEvent('HIGH_FREQ_UPDATE', payload), args);
      expect(args.pendingTimerUpdate.current).toBe(payload);
    });

    it('updates specialKeyTimers when present in payload', () => {
      const args = baseArgs();
      const payload = makeTimerPayload({ specialKeyTimers: { Key1: 42 } });
      handleMessageChannel(makeWorkerEvent('HIGH_FREQ_UPDATE', payload), args);
      expect(args.specialKeyTimers.current).toEqual({ Key1: 42 });
    });

    it('does not update specialKeyTimers when absent from payload', () => {
      const args = baseArgs();
      args.specialKeyTimers.current = { existing: 5 };
      const payload = {
        total: 100,
        first: 50,
        second: 25,
        third: 25,
        active: 50,
        activeTimer: 'Primary',
        activeSpecialKey: null,
      };
      handleMessageChannel(makeWorkerEvent('HIGH_FREQ_UPDATE', payload), args);
      expect(args.specialKeyTimers.current).toEqual({ existing: 5 });
    });

    it('updates activeSpecialKey to a string value', () => {
      const args = baseArgs();
      const payload = makeTimerPayload({ activeSpecialKey: 'SpecialA' });
      handleMessageChannel(makeWorkerEvent('HIGH_FREQ_UPDATE', payload), args);
      expect(args.activeSpecialKey.current).toBe('SpecialA');
    });

    it('updates activeSpecialKey to null when explicitly null', () => {
      const args = baseArgs();
      args.activeSpecialKey.current = 'Previous';
      const payload = makeTimerPayload({ activeSpecialKey: null });
      handleMessageChannel(makeWorkerEvent('HIGH_FREQ_UPDATE', payload), args);
      expect(args.activeSpecialKey.current).toBeNull();
    });

    it('does not update activeSpecialKey when undefined in payload', () => {
      const args = baseArgs();
      args.activeSpecialKey.current = 'Previous';
      const payload = {
        total: 100,
        first: 50,
        second: 25,
        third: 25,
        active: 50,
        activeTimer: 'Primary',
        specialKeyTimers: {},
      };
      handleMessageChannel(makeWorkerEvent('HIGH_FREQ_UPDATE', payload), args);
      expect(args.activeSpecialKey.current).toBe('Previous');
    });

    it('calls scheduleUIUpdate on HIGH_FREQ_UPDATE with payload', () => {
      const args = baseArgs();
      handleMessageChannel(makeWorkerEvent('HIGH_FREQ_UPDATE', makeTimerPayload()), args);
      expect(args.scheduleUIUpdate).toHaveBeenCalledOnce();
    });

    it('does not call scheduleUIUpdate for non-HIGH_FREQ_UPDATE message type', () => {
      const args = baseArgs();
      handleMessageChannel(makeWorkerEvent('TIMER_UPDATE', makeTimerPayload()), args);
      expect(args.scheduleUIUpdate).not.toHaveBeenCalled();
    });

    it('does not call scheduleUIUpdate when payload is null', () => {
      const args = baseArgs();
      handleMessageChannel(makeWorkerEvent('HIGH_FREQ_UPDATE', null), args);
      expect(args.scheduleUIUpdate).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // handleWorkerMessage
  // =========================================================================
  describe('handleWorkerMessage', () => {
    it('TIMER_UPDATE with payload: updates pendingTimerUpdate and calls scheduleUIUpdate', () => {
      const args = makeWorkerMessageArgs();
      const payload = makeTimerPayload();
      handleWorkerMessage(makeWorkerEvent('TIMER_UPDATE', payload), args);
      expect(args.pendingTimerUpdate.current).toBe(payload);
      expect(args.scheduleUIUpdate).toHaveBeenCalledOnce();
    });

    it('TIMER_UPDATE without payload: no-op', () => {
      const args = makeWorkerMessageArgs();
      handleWorkerMessage(makeWorkerEvent('TIMER_UPDATE', undefined), args);
      expect(args.pendingTimerUpdate.current).toBeNull();
      expect(args.scheduleUIUpdate).not.toHaveBeenCalled();
    });

    it('TIMER_UPDATE: updates specialKeyTimers when present in payload', () => {
      const args = makeWorkerMessageArgs();
      const payload = makeTimerPayload({ specialKeyTimers: { K: 5 } });
      handleWorkerMessage(makeWorkerEvent('TIMER_UPDATE', payload), args);
      expect(args.specialKeyTimers.current).toEqual({ K: 5 });
    });

    it('TIMER_UPDATE: does not update specialKeyTimers when absent from payload', () => {
      const args = makeWorkerMessageArgs();
      args.specialKeyTimers.current = { existing: 7 };
      const payload = {
        total: 100,
        first: 50,
        second: 25,
        third: 25,
        active: 50,
        activeTimer: 'Primary',
        activeSpecialKey: null,
      };
      handleWorkerMessage(makeWorkerEvent('TIMER_UPDATE', payload), args);
      expect(args.specialKeyTimers.current).toEqual({ existing: 7 });
    });

    it('TIMER_UPDATE: updates activeSpecialKey when defined in payload', () => {
      const args = makeWorkerMessageArgs();
      const payload = makeTimerPayload({ activeSpecialKey: 'SomeKey' });
      handleWorkerMessage(makeWorkerEvent('TIMER_UPDATE', payload), args);
      expect(args.activeSpecialKey.current).toBe('SomeKey');
    });

    it('TIMER_UPDATE: does not update activeSpecialKey when undefined in payload', () => {
      const args = makeWorkerMessageArgs();
      args.activeSpecialKey.current = 'Previous';
      const payload = {
        total: 100,
        first: 50,
        second: 25,
        third: 25,
        active: 50,
        activeTimer: 'Primary',
        specialKeyTimers: {},
      };
      handleWorkerMessage(makeWorkerEvent('TIMER_UPDATE', payload), args);
      expect(args.activeSpecialKey.current).toBe('Previous');
    });

    it('KEY_PROCESSED: appends key via setKeysPressed updater', () => {
      const args = makeWorkerMessageArgs();
      const key = makeKey();
      handleWorkerMessage(makeWorkerEvent('KEY_PROCESSED', { key, totalKeys: 1 }), args);
      expect(args.setKeysPressed).toHaveBeenCalledOnce();
      const updater = (args.setKeysPressed as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(updater([])).toEqual([key]);
    });

    it('KEY_DELETED: removes last key via setKeysPressed updater', () => {
      const args = makeWorkerMessageArgs();
      handleWorkerMessage(makeWorkerEvent('KEY_DELETED'), args);
      expect(args.setKeysPressed).toHaveBeenCalledOnce();
      const updater = (args.setKeysPressed as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const a = makeKey({ KeyName: 'a' });
      const b = makeKey({ KeyName: 'b' });
      const result = updater([a, b]);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(a);
    });

    it('SYSTEM_EVENT: updates activeTimerRef', () => {
      const args = makeWorkerMessageArgs();
      handleWorkerMessage(makeWorkerEvent('SYSTEM_EVENT', { activeTimer: 'Secondary' }), args);
      expect(args.activeTimerRef.current).toBe('Secondary');
    });

    it('SYSTEM_EVENT: updates activeSpecialKey', () => {
      const args = makeWorkerMessageArgs();
      handleWorkerMessage(makeWorkerEvent('SYSTEM_EVENT', { activeSpecialKey: 'SpecialK' }), args);
      expect(args.activeSpecialKey.current).toBe('SpecialK');
    });

    it('SYSTEM_EVENT: sets running state to Started when isRunning is true', () => {
      const args = makeWorkerMessageArgs();
      handleWorkerMessage(makeWorkerEvent('SYSTEM_EVENT', { isRunning: true }), args);
      expect(args.setRunningState).toHaveBeenCalledWith('Started');
    });

    it('SYSTEM_EVENT: sets running state to Not Started when isRunning is false', () => {
      const args = makeWorkerMessageArgs();
      handleWorkerMessage(makeWorkerEvent('SYSTEM_EVENT', { isRunning: false }), args);
      expect(args.setRunningState).toHaveBeenCalledWith('Not Started');
    });

    it('SYSTEM_EVENT: does not call setRunningState when isRunning is undefined', () => {
      const args = makeWorkerMessageArgs();
      handleWorkerMessage(makeWorkerEvent('SYSTEM_EVENT', {}), args);
      expect(args.setRunningState).not.toHaveBeenCalled();
    });

    it('SYSTEM_EVENT: handles events array without error', () => {
      const args = makeWorkerMessageArgs();
      handleWorkerMessage(makeWorkerEvent('SYSTEM_EVENT', { events: [makeKey()] }), args);
      expect(args.setRunningState).not.toHaveBeenCalled();
    });

    it('SESSION_ENDED with payload: triggers session end handling', async () => {
      const args = makeWorkerMessageArgs();
      handleWorkerMessage(makeWorkerEvent('SESSION_ENDED', makeSessionEndedPayload()), args);
      await flushPromises();
      expect(args.setRunningState).toHaveBeenCalledWith('Completed');
    });

    it('SESSION_ENDED without payload: no-op', async () => {
      const args = makeWorkerMessageArgs();
      handleWorkerMessage(makeWorkerEvent('SESSION_ENDED', undefined), args);
      await flushPromises();
      expect(args.setRunningState).not.toHaveBeenCalled();
    });

    it('SESSION_ENDED falls back to empty specialKeyTimers when payload value is null', () => {
      const args = makeWorkerMessageArgs();

      handleWorkerMessage(
        makeWorkerEvent('SESSION_ENDED', makeSessionEndedPayload({ specialKeyTimers: null } as any)),
        args,
      );

      expect(args.specialKeyTimers.current).toEqual({});
    });

    it('SESSION_ENDED uses special key timer when activeSpecialKey is set', () => {
      const args = makeWorkerMessageArgs({
        activeSpecialKey: makeRef<string | null>('SpecialKey'),
        specialKeyTimers: makeRef<Record<string, number>>({ SpecialKey: 42 }),
      });

      handleWorkerMessage(
        makeWorkerEvent(
          'SESSION_ENDED',
          makeSessionEndedPayload({
            reason: 'Stopped',
            specialKeyTimers: { SpecialKey: 42 },
            timers: { total: 100, first: 50, second: 25, third: 10 },
          }),
        ),
        args,
      );

      expect(args.pendingTimerUpdate.current?.active).toBe(42);
    });

    it('SESSION_ENDED uses 0 active time when active special key is missing in timer map', () => {
      const args = makeWorkerMessageArgs({
        activeSpecialKey: makeRef<string | null>('MissingKey'),
      });

      handleWorkerMessage(
        makeWorkerEvent(
          'SESSION_ENDED',
          makeSessionEndedPayload({
            reason: 'Stopped',
            specialKeyTimers: {},
            timers: { total: 100, first: 50, second: 25, third: 10 },
          }),
        ),
        args,
      );

      expect(args.pendingTimerUpdate.current?.active).toBe(0);
    });

    it('SESSION_ENDED uses secondary timer when active timer is Secondary', () => {
      const args = makeWorkerMessageArgs({ activeTimerRef: makeRef<any>('Secondary') });

      handleWorkerMessage(makeWorkerEvent('SESSION_ENDED', makeSessionEndedPayload({ reason: 'Stopped' })), args);

      expect(args.pendingTimerUpdate.current?.active).toBe(25);
    });

    it('SESSION_ENDED uses tertiary timer when active timer is Tertiary', () => {
      const args = makeWorkerMessageArgs({ activeTimerRef: makeRef<any>('Tertiary') });

      handleWorkerMessage(makeWorkerEvent('SESSION_ENDED', makeSessionEndedPayload({ reason: 'Stopped' })), args);

      expect(args.pendingTimerUpdate.current?.active).toBe(25);
    });

    it('SESSION_ENDED falls back to total timer for unknown active timer', () => {
      const args = makeWorkerMessageArgs({ activeTimerRef: makeRef<any>('UnknownTimer') });

      handleWorkerMessage(makeWorkerEvent('SESSION_ENDED', makeSessionEndedPayload({ reason: 'Stopped' })), args);

      expect(args.pendingTimerUpdate.current?.active).toBe(100);
    });

    it('SESSION_ENDED clamps total time for End on Primary Timer completion', () => {
      const args = makeWorkerMessageArgs({
        Settings: makeSettings({ TimerOption: 'End on Primary Timer', DurationS: 200 }),
      });

      handleWorkerMessage(
        makeWorkerEvent(
          'SESSION_ENDED',
          makeSessionEndedPayload({ reason: 'Completed', timers: { total: 100, first: 20, second: 20, third: 20 } }),
        ),
        args,
      );

      expect(args.pendingTimerUpdate.current?.total).toBe(200);
    });

    it('SESSION_ENDED clamps first/second/third timers for configured timer option', () => {
      const primaryArgs = makeWorkerMessageArgs({
        Settings: makeSettings({ TimerOption: 'End on Timer #1', DurationS: 60 }),
      });
      handleWorkerMessage(
        makeWorkerEvent(
          'SESSION_ENDED',
          makeSessionEndedPayload({ reason: 'Completed', timers: { total: 100, first: 10, second: 20, third: 30 } }),
        ),
        primaryArgs,
      );
      expect(primaryArgs.pendingTimerUpdate.current?.first).toBe(60);

      const secondaryArgs = makeWorkerMessageArgs({
        Settings: makeSettings({ TimerOption: 'End on Timer #2', DurationS: 70 }),
      });
      handleWorkerMessage(
        makeWorkerEvent(
          'SESSION_ENDED',
          makeSessionEndedPayload({ reason: 'Completed', timers: { total: 100, first: 10, second: 20, third: 30 } }),
        ),
        secondaryArgs,
      );
      expect(secondaryArgs.pendingTimerUpdate.current?.second).toBe(70);

      const tertiaryArgs = makeWorkerMessageArgs({
        Settings: makeSettings({ TimerOption: 'End on Timer #3', DurationS: 80 }),
      });
      handleWorkerMessage(
        makeWorkerEvent(
          'SESSION_ENDED',
          makeSessionEndedPayload({ reason: 'Completed', timers: { total: 100, first: 10, second: 20, third: 30 } }),
        ),
        tertiaryArgs,
      );
      expect(tertiaryArgs.pendingTimerUpdate.current?.third).toBe(80);
    });

    it('SESSION_ENDED clamps special key timer for numeric TimerOption', () => {
      const args = makeWorkerMessageArgs({
        Settings: makeSettings({ TimerOption: 83, DurationS: 90 }),
        Keyset: makeKeyset({
          SpecialDurationKeys: [{ KeyName: 'SpecialS', KeyCode: 83, KeyDescription: 'Special S' }],
        }),
        activeSpecialKey: makeRef<string | null>('SpecialS'),
      });

      handleWorkerMessage(
        makeWorkerEvent(
          'SESSION_ENDED',
          makeSessionEndedPayload({
            reason: 'Completed',
            specialKeyTimers: { SpecialS: 10 },
            timers: { total: 100, first: 10, second: 20, third: 30 },
          }),
        ),
        args,
      );

      expect(args.pendingTimerUpdate.current?.specialKeyTimers.SpecialS).toBe(90);
      expect(args.pendingTimerUpdate.current?.active).toBe(90);
    });

    it('SESSION_ENDED numeric TimerOption does not clamp when special key code is not found', () => {
      const args = makeWorkerMessageArgs({
        Settings: makeSettings({ TimerOption: 999, DurationS: 90 }),
        Keyset: makeKeyset({
          SpecialDurationKeys: [{ KeyName: 'SpecialS', KeyCode: 83, KeyDescription: 'Special S' }],
        }),
      });

      handleWorkerMessage(
        makeWorkerEvent(
          'SESSION_ENDED',
          makeSessionEndedPayload({
            reason: 'Completed',
            specialKeyTimers: { SpecialS: 10 },
            timers: { total: 100, first: 10, second: 20, third: 30 },
          }),
        ),
        args,
      );

      expect(args.pendingTimerUpdate.current?.specialKeyTimers.SpecialS).toBe(10);
    });

    it('SESSION_ENDED numeric TimerOption clamps from zero when special timer is initially missing', () => {
      const args = makeWorkerMessageArgs({
        Settings: makeSettings({ TimerOption: 83, DurationS: 90 }),
        Keyset: makeKeyset({
          SpecialDurationKeys: [{ KeyName: 'SpecialS', KeyCode: 83, KeyDescription: 'Special S' }],
        }),
      });

      handleWorkerMessage(
        makeWorkerEvent(
          'SESSION_ENDED',
          makeSessionEndedPayload({
            reason: 'Completed',
            specialKeyTimers: {},
            timers: { total: 100, first: 10, second: 20, third: 30 },
          }),
        ),
        args,
      );

      expect(args.pendingTimerUpdate.current?.specialKeyTimers.SpecialS).toBe(90);
    });

    it('SESSION_ENDED with unmatched completed timer option leaves timers unchanged', () => {
      const args = makeWorkerMessageArgs({
        Settings: makeSettings({ TimerOption: 'Unknown Option' as any, DurationS: 300 }),
      });

      handleWorkerMessage(
        makeWorkerEvent(
          'SESSION_ENDED',
          makeSessionEndedPayload({
            reason: 'Completed',
            timers: { total: 100, first: 10, second: 20, third: 30 },
          }),
        ),
        args,
      );

      expect(args.pendingTimerUpdate.current?.total).toBe(100);
      expect(args.pendingTimerUpdate.current?.first).toBe(10);
      expect(args.pendingTimerUpdate.current?.second).toBe(20);
      expect(args.pendingTimerUpdate.current?.third).toBe(30);
    });
  });

  // =========================================================================
  // handleSessionEnded
  // =========================================================================
  describe('handleSessionEnded', () => {
    it('returns early without side-effects when endingProcessedRef is already true', async () => {
      const args = makeSessionEndedArgs({ endingProcessedRef: makeRef(true) });
      await handleSessionEnded(makeSessionEndedPayload(), args);
      await flushPromises();
      expect(args.setRunningState).not.toHaveBeenCalled();
    });

    it('sets endingProcessedRef to true on first call', async () => {
      const args = makeSessionEndedArgs();
      await handleSessionEnded(makeSessionEndedPayload(), args);
      expect(args.endingProcessedRef.current).toBe(true);
    });

    it('prevents double execution on repeated calls', async () => {
      const args = makeSessionEndedArgs();
      await handleSessionEnded(makeSessionEndedPayload(), args);
      await handleSessionEnded(makeSessionEndedPayload(), args);
      await flushPromises();
      expect(args.mutateSessionOutcomes.mutateAsync).toHaveBeenCalledOnce();
    });

    it('sets running state to the reason value', async () => {
      const args = makeSessionEndedArgs();
      await handleSessionEnded(makeSessionEndedPayload({ reason: 'Completed' }), args);
      await flushPromises();
      expect(args.setRunningState).toHaveBeenCalledWith('Completed');
    });

    it('sets startTime from the session start ISO string', async () => {
      const isoTime = '2024-06-15T12:00:00.000Z';
      const args = makeSessionEndedArgs();
      await handleSessionEnded(makeSessionEndedPayload({ startTime: isoTime }), args);
      await flushPromises();
      expect(args.setStartTime).toHaveBeenCalledWith(new Date(isoTime));
    });

    it('Cancelled: shows confirm dialog', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const args = makeSessionEndedArgs();
      await handleSessionEnded(makeSessionEndedPayload({ reason: 'Cancelled' }), args);
      await flushPromises();
      expect(window.confirm).toHaveBeenCalled();
    });

    it('Cancelled + user declines: navigates back and skips save', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const args = makeSessionEndedArgs();
      await handleSessionEnded(makeSessionEndedPayload({ reason: 'Cancelled' }), args);
      await flushPromises();
      expect(args.history.go).toHaveBeenCalledWith(-1);
      expect(args.mutateSessionOutcomes.mutateAsync).not.toHaveBeenCalled();
    });

    it('Cancelled + user confirms: saves session with EndedEarly=true', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const args = makeSessionEndedArgs();
      await handleSessionEnded(makeSessionEndedPayload({ reason: 'Cancelled' }), args);
      await flushPromises();
      expect(args.mutateSessionOutcomes.mutateAsync).toHaveBeenCalledOnce();
      const call = (args.mutateSessionOutcomes.mutateAsync as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.NewOutcome.EndedEarly).toBe(true);
    });

    it('releases wakelock when one is held', async () => {
      const release = vi.fn();
      const sentinel = { release } as unknown as WakeLockSentinel;
      const wakelockRef = makeRef<WakeLockSentinel | undefined>(sentinel);
      const args = makeSessionEndedArgs({ wakelockRef });
      await handleSessionEnded(makeSessionEndedPayload(), args);
      await flushPromises();
      expect(release).toHaveBeenCalledOnce();
      expect(wakelockRef.current).toBeUndefined();
    });

    it('does not throw when no wakelock is held', async () => {
      const args = makeSessionEndedArgs({ wakelockRef: makeRef<WakeLockSentinel | undefined>(undefined) });
      await expect(handleSessionEnded(makeSessionEndedPayload(), args)).resolves.toBeUndefined();
    });

    it('saves the correct session file structure', async () => {
      const freqKey = makeKey({ KeyType: 'Frequency' });
      const durKey = makeKey({ KeyType: 'Duration' });
      const sysKey = makeKey({ KeyType: 'System' });
      const isoTime = '2024-01-01T00:00:00.000Z';
      const args = makeSessionEndedArgs();
      const payload = makeSessionEndedPayload({
        keysPressed: [freqKey, durKey],
        systemKeysPressed: [sysKey],
        timers: { total: 100, first: 50, second: 25, third: 15 },
        specialKeyTimers: { SK: 10 },
        startTime: isoTime,
      });

      await handleSessionEnded(payload, args);
      await flushPromises();

      const call = (args.mutateSessionOutcomes.mutateAsync as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.NewOutcome.FrequencyKeyPresses).toEqual([freqKey]);
      expect(call.NewOutcome.DurationKeyPresses).toEqual([durKey]);
      expect(call.NewOutcome.SystemKeyPresses).toEqual([sysKey]);
      expect(call.NewOutcome.TimerMain).toBe(100);
      expect(call.NewOutcome.TimerOne).toBe(50);
      expect(call.NewOutcome.TimerTwo).toBe(25);
      expect(call.NewOutcome.TimerThree).toBe(15);
      expect(call.NewOutcome.SpecialKeyTimers).toEqual({ SK: 10 });
      expect(call.NewOutcome.SessionStart).toBe(new Date(isoTime).toJSON());
      expect(call.NewOutcome.EndedEarly).toBe(false);
    });

    it('uses empty object for SpecialKeyTimers when payload value is falsy', async () => {
      const args = makeSessionEndedArgs();
      await handleSessionEnded(makeSessionEndedPayload({ specialKeyTimers: null }) as any, args);
      await flushPromises();
      const call = (args.mutateSessionOutcomes.mutateAsync as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.NewOutcome.SpecialKeyTimers).toEqual({});
    });

    it('increments Session number in mutateSettings call', async () => {
      const args = makeSessionEndedArgs();
      await handleSessionEnded(makeSessionEndedPayload(), args);
      await flushPromises();
      const call = (args.mutateSettings.mutateAsync as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.Settings.Session).toBe(2);
    });

    it('AutoAdvance: calls history.go(-1) after save', async () => {
      const args = makeSessionEndedArgs({
        ApplicationSettings: makeAppSettings({ PostSessionBx: 'AutoAdvance' }),
      });
      await handleSessionEnded(makeSessionEndedPayload(), args);
      await flushPromises();
      expect(args.history.go).toHaveBeenCalledWith(-1);
    });

    it('AwaitInput: shows a toast after save', async () => {
      const args = makeSessionEndedArgs({
        ApplicationSettings: makeAppSettings({ PostSessionBx: 'AwaitInput' }),
      });
      await handleSessionEnded(makeSessionEndedPayload(), args);
      await flushPromises();
      expect(toast).toHaveBeenCalled();
    });

    it('AwaitInput: toast action onClick calls history.go(-1)', async () => {
      const args = makeSessionEndedArgs({
        ApplicationSettings: makeAppSettings({ PostSessionBx: 'AwaitInput' }),
      });
      await handleSessionEnded(makeSessionEndedPayload(), args);
      await flushPromises();
      const toastCall = (toast as ReturnType<typeof vi.fn>).mock.calls[0];
      const action = toastCall[1]?.action;
      expect(action).toBeDefined();
      action.onClick();
      expect(args.history.go).toHaveBeenCalledWith(-1);
    });

    it('calls displayConditionalNotification when mutation throws', async () => {
      const args = makeSessionEndedArgs();
      (args.mutateSessionOutcomes.mutateAsync as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('save error'));
      await handleSessionEnded(makeSessionEndedPayload(), args);
      await flushPromises();
      expect(args.displayConditionalNotification).toHaveBeenCalled();
    });

    it('calls displayConditionalNotification when session start time is missing', async () => {
      const args = makeSessionEndedArgs();
      await handleSessionEnded(makeSessionEndedPayload({ startTime: null } as any), args);
      await flushPromises();
      expect(args.displayConditionalNotification).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // switchTimer
  // =========================================================================
  describe('switchTimer', () => {
    it('posts SWITCH_TIMER with Primary to worker', () => {
      const postMessage = vi.fn();
      const workerRef = makeRef<Worker | null>({ postMessage } as unknown as Worker);
      switchTimer('Primary', workerRef);
      expect(postMessage).toHaveBeenCalledWith({ type: 'SWITCH_TIMER', payload: { timer: 'Primary' } });
    });

    it('posts SWITCH_TIMER with Secondary to worker', () => {
      const postMessage = vi.fn();
      const workerRef = makeRef<Worker | null>({ postMessage } as unknown as Worker);
      switchTimer('Secondary', workerRef);
      expect(postMessage).toHaveBeenCalledWith({ type: 'SWITCH_TIMER', payload: { timer: 'Secondary' } });
    });

    it('posts SWITCH_TIMER with Tertiary to worker', () => {
      const postMessage = vi.fn();
      const workerRef = makeRef<Worker | null>({ postMessage } as unknown as Worker);
      switchTimer('Tertiary', workerRef);
      expect(postMessage).toHaveBeenCalledWith({ type: 'SWITCH_TIMER', payload: { timer: 'Tertiary' } });
    });

    it('does nothing when worker is null', () => {
      const workerRef = makeRef<Worker | null>(null);
      expect(() => switchTimer('Primary', workerRef)).not.toThrow();
    });
  });

  // =========================================================================
  // switchToSpecialKey
  // =========================================================================
  describe('switchToSpecialKey', () => {
    it('posts SWITCH_SPECIAL_KEY with key name to worker', () => {
      const postMessage = vi.fn();
      const workerRef = makeRef<Worker | null>({ postMessage } as unknown as Worker);
      switchToSpecialKey('SomeKey', workerRef);
      expect(postMessage).toHaveBeenCalledWith({ type: 'SWITCH_SPECIAL_KEY', payload: { specialKeyName: 'SomeKey' } });
    });

    it('does nothing when worker is null', () => {
      const workerRef = makeRef<Worker | null>(null);
      expect(() => switchToSpecialKey('SomeKey', workerRef)).not.toThrow();
    });
  });

  // =========================================================================
  // SessionProcessKeypress
  // =========================================================================
  describe('SessionProcessKeypress', () => {
    let postMessage: ReturnType<typeof vi.fn>;
    let workerRef: { current: Worker | null };
    let historyGoSpy: ReturnType<typeof vi.spyOn>;

    const keypressArgs = (overrides: Record<string, unknown> = {}) => ({
      ApplicationSettings: makeAppSettings(),
      Keyset: makeKeyset(),
      runningState: 'Started' as const,
      workerRef,
      endingProcessedRef: makeRef(false),
      wakelockRef: makeRef<WakeLockSentinel | undefined>(undefined),
      setStartTime: vi.fn(),
      keysPressed: [] as any[],
      ...overrides,
    });

    beforeEach(() => {
      postMessage = vi.fn();
      workerRef = makeRef<Worker | null>({ postMessage } as unknown as Worker);
      historyGoSpy = vi.spyOn(window.history, 'go').mockImplementation(() => {});
    });

    it('returns early when ev.repeat is true', () => {
      SessionProcessKeypress(makeKeyEvent('a', { repeat: true }), keypressArgs());
      expect(postMessage).not.toHaveBeenCalled();
    });

    it('calls preventDefault when key is the space character', () => {
      const ev = makeKeyEvent(' ');
      SessionProcessKeypress(ev, keypressArgs());
      expect(ev.preventDefault).toHaveBeenCalled();
    });

    it('calls preventDefault when key is the string "Space"', () => {
      const ev = makeKeyEvent('Space');
      SessionProcessKeypress(ev, keypressArgs());
      expect(ev.preventDefault).toHaveBeenCalled();
    });

    describe('Not Started state', () => {
      it('calls history.go(-1) on Escape', () => {
        SessionProcessKeypress(makeKeyEvent('Escape'), keypressArgs({ runningState: 'Not Started' }));
        expect(historyGoSpy).toHaveBeenCalledWith(-1);
      });

      it('posts START_SESSION and shows toast on Enter with worker', () => {
        const setStartTime = vi.fn();
        SessionProcessKeypress(makeKeyEvent('Enter'), keypressArgs({ runningState: 'Not Started', setStartTime }));
        expect(postMessage).toHaveBeenCalledWith({ type: 'START_SESSION' });
        expect(setStartTime).toHaveBeenCalled();
        expect(toast).toHaveBeenCalled();
      });

      it('resets endingProcessedRef to false on Enter', () => {
        const endingProcessedRef = makeRef(true);
        SessionProcessKeypress(
          makeKeyEvent('Enter'),
          keypressArgs({ runningState: 'Not Started', endingProcessedRef }),
        );
        expect(endingProcessedRef.current).toBe(false);
      });

      it('does not post message on Enter when worker is null', () => {
        SessionProcessKeypress(
          makeKeyEvent('Enter'),
          keypressArgs({ runningState: 'Not Started', workerRef: makeRef(null) }),
        );
        expect(postMessage).not.toHaveBeenCalled();
      });

      it('requests wakelock on Enter when navigator.wakeLock is available', async () => {
        const sentinel = { release: vi.fn() } as unknown as WakeLockSentinel;
        const requestMock = vi.fn().mockResolvedValue(sentinel);
        const wakelockRef = makeRef<WakeLockSentinel | undefined>(undefined);

        Object.defineProperty(navigator, 'wakeLock', {
          value: { request: requestMock },
          writable: true,
          configurable: true,
        });

        SessionProcessKeypress(makeKeyEvent('Enter'), keypressArgs({ runningState: 'Not Started', wakelockRef }));
        await flushPromises();

        expect(requestMock).toHaveBeenCalledWith('screen');
        expect(wakelockRef.current).toBe(sentinel);

        Object.defineProperty(navigator, 'wakeLock', { value: undefined, writable: true, configurable: true });
      });

      it('does not post worker message for arbitrary key in Not Started state', () => {
        SessionProcessKeypress(makeKeyEvent('a'), keypressArgs({ runningState: 'Not Started' }));
        expect(postMessage).not.toHaveBeenCalled();
      });
    });

    describe('Completed state', () => {
      it('calls history.go(-1) and returns on Escape', () => {
        SessionProcessKeypress(makeKeyEvent('Escape'), keypressArgs({ runningState: 'Completed' }));
        expect(historyGoSpy).toHaveBeenCalledWith(-1);
        expect(postMessage).not.toHaveBeenCalled();
      });

      it('does not navigate on non-Escape key in Completed state', () => {
        SessionProcessKeypress(makeKeyEvent('a'), keypressArgs({ runningState: 'Completed' }));
        expect(historyGoSpy).not.toHaveBeenCalled();
      });

      it('still processes key press in Completed state with z', () => {
        SessionProcessKeypress(makeKeyEvent('z'), keypressArgs({ runningState: 'Completed' }));
        expect(postMessage).toHaveBeenCalledWith({ type: 'SWITCH_TIMER', payload: { timer: 'Primary' } });
      });
    });

    describe('Started state', () => {
      it('sends STOP_SESSION Cancelled on Escape', () => {
        SessionProcessKeypress(makeKeyEvent('Escape'), keypressArgs());
        expect(postMessage).toHaveBeenCalledWith({ type: 'STOP_SESSION', payload: { reason: 'Cancelled' } });
      });

      it('switches to Primary timer on z', () => {
        SessionProcessKeypress(makeKeyEvent('z'), keypressArgs());
        expect(postMessage).toHaveBeenCalledWith({ type: 'SWITCH_TIMER', payload: { timer: 'Primary' } });
      });

      it('switches to Secondary timer on x when TimerTwoDisplay is show', () => {
        SessionProcessKeypress(
          makeKeyEvent('x'),
          keypressArgs({ ApplicationSettings: makeAppSettings({ TimerTwoDisplay: 'show' }) }),
        );
        expect(postMessage).toHaveBeenCalledWith({ type: 'SWITCH_TIMER', payload: { timer: 'Secondary' } });
      });

      it('does not switch Secondary timer on x when TimerTwoDisplay is hide', () => {
        SessionProcessKeypress(
          makeKeyEvent('x'),
          keypressArgs({ ApplicationSettings: makeAppSettings({ TimerTwoDisplay: 'hide' }) }),
        );
        expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'PROCESS_KEY' }));
      });

      it('switches to Tertiary timer on c when TimerThreeDisplay is show', () => {
        SessionProcessKeypress(
          makeKeyEvent('c'),
          keypressArgs({ ApplicationSettings: makeAppSettings({ TimerThreeDisplay: 'show' }) }),
        );
        expect(postMessage).toHaveBeenCalledWith({ type: 'SWITCH_TIMER', payload: { timer: 'Tertiary' } });
      });

      it('does not switch Tertiary timer on c when TimerThreeDisplay is hide', () => {
        SessionProcessKeypress(
          makeKeyEvent('c'),
          keypressArgs({ ApplicationSettings: makeAppSettings({ TimerThreeDisplay: 'hide' }) }),
        );
        expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'PROCESS_KEY' }));
      });

      it('switches to special key when matching SpecialDurationKey is pressed', () => {
        const specialKey = { KeyName: 'S', KeyCode: 83, KeyDescription: 'Special' };
        const Keyset = makeKeyset({ SpecialDurationKeys: [specialKey] });
        SessionProcessKeypress(makeKeyEvent('s'), keypressArgs({ Keyset }));
        expect(postMessage).toHaveBeenCalledWith({ type: 'SWITCH_SPECIAL_KEY', payload: { specialKeyName: 'S' } });
      });

      it('special key match is case-insensitive', () => {
        const specialKey = { KeyName: 'S', KeyCode: 83, KeyDescription: 'Special' };
        const Keyset = makeKeyset({ SpecialDurationKeys: [specialKey] });
        SessionProcessKeypress(makeKeyEvent('S'), keypressArgs({ Keyset }));
        expect(postMessage).toHaveBeenCalledWith({ type: 'SWITCH_SPECIAL_KEY', payload: { specialKeyName: 'S' } });
      });

      it('does nothing on Backspace when keysPressed is empty', () => {
        SessionProcessKeypress(makeKeyEvent('Backspace'), keypressArgs({ keysPressed: [] }));
        expect(postMessage).not.toHaveBeenCalled();
      });

      it('sends DELETE_LAST_KEY on Backspace when keys are present', () => {
        SessionProcessKeypress(makeKeyEvent('Backspace'), keypressArgs({ keysPressed: [makeKey()] }));
        expect(postMessage).toHaveBeenCalledWith({ type: 'DELETE_LAST_KEY' });
      });

      it('does nothing on Delete when keysPressed is empty', () => {
        SessionProcessKeypress(makeKeyEvent('Delete'), keypressArgs({ keysPressed: [] }));
        expect(postMessage).not.toHaveBeenCalled();
      });

      it('sends DELETE_LAST_KEY on Delete when keys are present', () => {
        SessionProcessKeypress(makeKeyEvent('Delete'), keypressArgs({ keysPressed: [makeKey()] }));
        expect(postMessage).toHaveBeenCalledWith({ type: 'DELETE_LAST_KEY' });
      });

      it('sends PROCESS_KEY with keyName and keyCode for arbitrary key', () => {
        const ev = makeKeyEvent('a');
        SessionProcessKeypress(ev, keypressArgs());
        expect(postMessage).toHaveBeenCalledWith({ type: 'PROCESS_KEY', payload: { keyName: 'a', keyCode: 97 } });
      });

      it('does nothing when worker is null', () => {
        SessionProcessKeypress(makeKeyEvent('a'), keypressArgs({ workerRef: makeRef(null) }));
        expect(postMessage).not.toHaveBeenCalled();
      });
    });
  });
});
