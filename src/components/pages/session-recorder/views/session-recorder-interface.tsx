import { useEventListener } from '@/components/elements/behavior/event-listeners';
import { SavedSettings } from '@/lib/dtos/session-settings';
import { KeySet } from '@/types/keyset/core';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { KeyManageType, TimerSetting } from '@/types/timing';
import SessionRecorderWorker from '@/workers/timing/session-recorder-worker.ts?worker';
import SessionRecorderInstructions from './ui-instructions';
import KeyHistoryListing from './ui-key-listing';
import { displayConditionalNotification } from '@/lib/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mutationSettingsParams } from '@/queries/session/mutate-session-params';
import { useRouter } from '@tanstack/react-router';
import { mutationSettingsOutcomes } from '@/queries/outcomes/mutate-session-outcomes';
import { TimerUpdatePayload } from '@/workers/timing/types/session-recorder-worker-payloads';
import { WorkerMessage, WorkerResponse } from '@/workers/timing/types/session-recorder-worker-messaging';
import { ApplicationSettingsTypes } from '@/types/settings/application-settings';
import SessionRecorderFrequencyTallies from './ui-counts-frequency';
import SessionRecorderDurationTallies from './ui-counts-duration';
import SessionHeaderComponent from '../subpanels/header-component';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatTimeOfDay } from '@/lib/time';
import { handleMessageChannel, handleWorkerMessage, SessionProcessKeypress } from '@/lib/session-keypress';
import { RunningStateOptions } from '@/types/session';
import { cn } from '@/lib/utils';
import { useConfirmDialog } from '@/components/dialogs/use-confirm-dialog';

type Props = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Keyset: KeySet;
  Settings: SavedSettings;
  Handle: FileSystemDirectoryHandle;
  ApplicationSettings: ApplicationSettingsTypes;
};

export default function SessionRecorderInterface({
  Group,
  Individual,
  Evaluation,
  Keyset,
  Settings,
  Handle,
  ApplicationSettings,
}: Props) {
  const router = useRouter();
  const { history } = router;
  const queryClient = useQueryClient();

  const [keysPressed, setKeysPressed] = useState<KeyManageType[]>([]);

  const workerRef = useRef<Worker | null>(null);
  const messageChannelRef = useRef<MessageChannel | null>(null);

  const animationFrameRef = useRef<number | undefined>(undefined);

  const mutateSessionOutcomes = useMutation({
    mutationFn: mutationSettingsOutcomes,
    onSuccess: async (data) => {
      queryClient.setQueryData(['/', Group, Individual, Evaluation, 'outcomes'], data);

      // Invalidate other routes with results
      await router.invalidate({
        filter: (match) =>
          match.routeId === '/session/$group/$individual/$evaluation/history/' ||
          match.routeId === '/session/$group/$individual/$evaluation/proportion' ||
          match.routeId === '/session/$group/$individual/$evaluation/rate' ||
          match.routeId === '/session/$group/$individual/$evaluation/reli' ||
          match.routeId === '/session/$group/$individual/$evaluation/view',
        sync: false,
      });
    },
  });

  const mutateSettings = useMutation({
    mutationFn: mutationSettingsParams,
    onSuccess: (data) => {
      queryClient.setQueryData(['/', Group, Individual, Evaluation, 'settings'], data);
    },
  });

  const { openConfirmDialog, confirmDialog } = useConfirmDialog();

  // Like this better, cleaner and more predictable dialog (prev instructions were awful)
  const confirmEndedEarly = useCallback(
    () =>
      new Promise<boolean>((resolve) =>
        openConfirmDialog({
          title: 'Session ended early',
          description:
            'This session was terminated early. Save the results, or discard the session and return to the session overview to re-attempt it.',
          confirmLabel: 'Save Results',
          cancelLabel: 'Discard',
          autoFocusConfirm: true,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        }),
      ),
    [openConfirmDialog],
  );

  // Timer state managed by worker, but we keep refs for UI updates
  const secondsElapsedTotal = useRef<number>(0);
  const secondsElapsedFirst = useRef<number>(0);
  const secondsElapsedSecond = useRef<number>(0);
  const secondsElapsedThird = useRef<number>(0);
  const secondsElapsedActive = useRef<number>(0);

  // Pending state for updates
  const pendingTimerUpdate = useRef<TimerUpdatePayload | null>(null);

  // Special key timer state
  const specialKeyTimers = useRef<Record<string, number>>({});
  const activeSpecialKey = useRef<string | null>(null);

  const wakelockRef = useRef<WakeLockSentinel | undefined>(undefined);
  const endingProcessedRef = useRef<boolean>(false);

  const [runningState, setRunningState] = useState<RunningStateOptions>('Not Started');
  const [, setStartTime] = useState<Date | null>(null);
  const activeTimerRef = useRef<TimerSetting>('Stopped');
  const [, forceUpdate] = useState({});

  // Experimental: Pool all worker updates, since we only need one update within in frame  
  const scheduleUIUpdate = () => {
    if (animationFrameRef.current) return;

    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = undefined;

      const update = pendingTimerUpdate.current;
      if (!update) return;

      secondsElapsedTotal.current = update.total;
      secondsElapsedFirst.current = update.first;
      secondsElapsedSecond.current = update.second;
      secondsElapsedThird.current = update.third;
      secondsElapsedActive.current = update.active;
      activeTimerRef.current = update.activeTimer;

      pendingTimerUpdate.current = null;
      forceUpdate({});
    });
  };

  // Per handlers; workers to pull from here to avoid stale props
  const latestProps = useRef({
    ApplicationSettings,
    Group,
    Individual,
    Evaluation,
    Handle,
    history,
    mutateSessionOutcomes,
    mutateSettings,
    confirmEndedEarly,
  });

  useEffect(() => {
    latestProps.current = {
      ApplicationSettings,
      Group,
      Individual,
      Evaluation,
      Handle,
      history,
      mutateSessionOutcomes,
      mutateSettings,
      confirmEndedEarly,
    };
  });

  // Lazy load dialogs, probably not even worth it tho
  useEffect(() => {
    void import('@/components/dialogs/confirm-dialog');
  }, []);

  // Initialize worker and handle cleanup
  useEffect(() => {
    // Create worker instance
    workerRef.current = new SessionRecorderWorker();

    // Set up MessageChannel for high-frequency updates
    messageChannelRef.current = new MessageChannel();
    const setupMessage: WorkerMessage = {
      type: 'SETUP_CHANNEL',
      ports: [messageChannelRef.current.port2],
    };
    workerRef.current.postMessage(setupMessage, [messageChannelRef.current.port2]);

    // Initialize worker with settings and keyset
    const initMessage: WorkerMessage = {
      type: 'INIT',
      payload: { settings: Settings, keyset: Keyset, uiPollingInterval: ApplicationSettings.RecorderPolling },
    };

    workerRef.current.postMessage(initMessage);

    messageChannelRef.current.port1.onmessage = (event: MessageEvent<WorkerResponse>) =>
      handleMessageChannel(event, {
        pendingTimerUpdate,
        specialKeyTimers,
        activeSpecialKey,
        scheduleUIUpdate,
      });

    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) =>
      handleWorkerMessage(event, {
        ...latestProps.current,
        displayConditionalNotification,
        setRunningState,
        setStartTime,
        Keyset,
        endingProcessedRef,
        wakelockRef,
        Settings,
        pendingTimerUpdate,
        specialKeyTimers,
        activeSpecialKey,
        scheduleUIUpdate,
        setKeysPressed,
        activeTimerRef,
      });

    // Cleanup worker on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      messageChannelRef.current?.port1.close();
      messageChannelRef.current = null;
      workerRef.current?.terminate();
      workerRef.current = null;
      if (wakelockRef.current) {
        wakelockRef.current.release();
        wakelockRef.current = undefined;
      }
    };
  }, [Settings, Keyset, ApplicationSettings.RecorderPolling]);

  useEventListener('keydown', (ev: React.KeyboardEvent<HTMLElement>) =>
    SessionProcessKeypress(ev, {
      runningState,
      workerRef,
      setStartTime,
      ApplicationSettings,
      keysPressed,
      Keyset,
      endingProcessedRef,
      wakelockRef,
      history,
    }),
  );

  const keySetSpecialKeys = Keyset.SpecialDurationKeys;

  const totalDurationKeys = useMemo(
    () => [...Keyset.DurationKeys, ...Keyset.ScorableDurationKeys],
    [Keyset],
  );

  // Count of active duration keys (keys with odd press counts)
  const activeDurationKeysCount = useMemo(() => {
    const pressCounts = new Map<number, number>();
    for (const pressedKey of keysPressed) {
      pressCounts.set(pressedKey.KeyCode, (pressCounts.get(pressedKey.KeyCode) ?? 0) + 1);
    }

    return totalDurationKeys.filter((key) => (pressCounts.get(key.KeyCode) ?? 0) % 2 === 1).length;
  }, [totalDurationKeys, keysPressed]);

  const HeaderComponent = useMemo(() => {
    return <SessionHeaderComponent Settings={Settings} RunningState={runningState} KeySet={Keyset} />;
  }, [Settings, runningState, Keyset]);

  // Active duration keys display a live running time, so the tallies must re-render with each timer update
  const liveDurationTick = activeDurationKeysCount > 0 ? secondsElapsedTotal.current : null;

  const DurationCountsSummary = useMemo(() => {
    if (totalDurationKeys.length === 0) return null;

    return <SessionRecorderDurationTallies Keyset={Keyset} KeysPressed={keysPressed} Settings={ApplicationSettings} />;
  }, [Keyset, keysPressed, ApplicationSettings, liveDurationTick]);

  const FrequencyCountsSummary = useMemo(() => {
    return <SessionRecorderFrequencyTallies Keyset={Keyset} KeysPressed={keysPressed} Settings={ApplicationSettings} />;
  }, [Keyset, keysPressed, ApplicationSettings]);

  const SessionInstructions = useMemo(() => {
    return (
      <SessionRecorderInstructions
        {...{ Evaluation, Settings, AppSettings: ApplicationSettings }}
        KeySetSpecialKeys={keySetSpecialKeys}
      />
    );
  }, [Evaluation, Settings, keySetSpecialKeys, ApplicationSettings]);

  const KeysPressedHistory = useMemo(() => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-9">Key</TableHead>
            <TableHead className="h-9">Description</TableHead>
            <TableHead className="h-9">Schedule</TableHead>
            <TableHead className="h-9">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keysPressed
            .slice(-5)
            .reverse()
            .map((key, index) => (
              <TableRow
                key={`${key.KeyType}-${key.KeyCode}-${key.TimePressed.toUTCString()}-${index}`}
                className="text-sm"
              >
                <TableCell className="h-9 py-0">{key.KeyName}</TableCell>
                <TableCell className="h-9 py-0">{key.KeyDescription}</TableCell>
                <TableCell className="h-9 py-0">{key.KeyScheduleRecording}</TableCell>
                <TableCell className="h-9 py-0">
                  {formatTimeOfDay(key.TimePressed)} ({key.TimeIntoSession.toFixed(2)}s)
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    );
  }, [keysPressed]);

  return (
    <div className="flex flex-col w-full gap-4">
      {HeaderComponent}
      {confirmDialog}

      <div
        className={cn('grid grid-cols-2 w-full gap-4 select-none', {
          'grid-cols-1': DurationCountsSummary === null,
        })}
      >
        {FrequencyCountsSummary}
        {DurationCountsSummary}
      </div>

      <div className="grid grid-cols-2 w-full gap-4 select-none">
        {SessionInstructions}

        <div className="w-full flex flex-col gap-0 border rounded shadow-xl bg-card">
          <div className="w-full text-center my-2 text-sm font-bold">Session Measurements</div>

          <hr className="mb-2" />

          <KeyHistoryListing
            KeySetSpecialKeys={keySetSpecialKeys}
            SpecialKeyTimers={specialKeyTimers.current}
            SecondsElapsed={secondsElapsedTotal.current}
            SecondsElapsedFirst={secondsElapsedFirst.current}
            SecondsElapsedSecond={secondsElapsedSecond.current}
            SecondsElapsedThird={secondsElapsedThird.current}
            SecondsElapsedDelta={secondsElapsedActive.current}
            ActiveTimer={activeTimerRef.current}
            ActiveSpecialTimer={activeSpecialKey.current}
            Running={runningState === 'Started'}
            AppSettings={ApplicationSettings}
          />

          <hr />
          {KeysPressedHistory}
        </div>
      </div>
    </div>
  );
}
