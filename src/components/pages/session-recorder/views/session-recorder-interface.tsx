import { useEventListener } from '@/components/elements/behavior/event-listeners';
import { SavedSettings } from '@/lib/dtos';
import { KeySet } from '@/types/keyset';
import { useState, useRef, useEffect, useMemo } from 'react';
import { KeyManageType, TimerSetting } from '@/types/timing';
import SessionRecorderWorker from '@/workers/timing/session-recorder-worker.ts?worker';
import SessionRecorderInstructions from './ui-instructions';
import KeyHistoryListing from './ui-key-listing';
import { displayConditionalNotification } from '@/lib/notifications';
import { useMutation } from '@tanstack/react-query';
import { mutationSettingsParams } from '@/queries/session/mutate-session-params';
import { queryClient } from '@/App';
import { useRouter } from '@tanstack/react-router';
import { mutationSettingsOutcomes } from '@/queries/outcomes/mutate-session-outcomes';
import { TimerUpdatePayload } from '@/workers/timing/types/session-recorder-worker-payloads';
import { WorkerMessage, WorkerResponse } from '@/workers/timing/types/session-recorder-worker-messaging';
import { ApplicationSettingsTypes } from '@/types/settings/application-settings';
import { SessionPollingIntervals } from '@/types/settings/performance-settings';
import SessionRecorderFrequencyTallies from './ui-counts-frequency';
import SessionRecorderDurationTallies from './ui-counts-duration';
import SessionHeaderComponent from '../subpanels/header-component';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatTimeOfDay } from '@/lib/time';
import { handleMessageChannel, handleWorkerMessage, SessionProcessKeypress } from '@/lib/session-keypress';
import { RunningStateOptions } from '@/types/session';

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
  const { history } = useRouter();
  const router = useRouter();

  const UI_POLL_INTERVAL = SessionPollingIntervals[ApplicationSettings.RecorderPolling] || 100;

  const [keysPressed, setKeysPressed] = useState<KeyManageType[]>([]);

  const workerRef = useRef<Worker | null>(null);
  const messageChannelRef = useRef<MessageChannel | null>(null);

  const animationFrameRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);

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

  const wakelockRef = useRef<WakeLockSentinel>();
  const endingProcessedRef = useRef<boolean>(false);

  const [runningState, setRunningState] = useState<RunningStateOptions>('Not Started');
  const [, setStartTime] = useState<Date | null>(null);
  const activeTimerRef = useRef<TimerSetting>('Stopped');
  const [, forceUpdate] = useState({});
  const [activeDurationKeysCount, setActiveDurationKeysCount] = useState<number>(0);

  // Optimized UI update function using requestAnimationFrame
  const scheduleUIUpdate = () => {
    if (animationFrameRef.current) return;

    animationFrameRef.current = requestAnimationFrame((currentTime) => {
      animationFrameRef.current = undefined;

      // Throttle to ~60fps maximum
      if (currentTime - lastUpdateTimeRef.current >= 16.67) {
        if (pendingTimerUpdate.current) {
          const update = pendingTimerUpdate.current;
          secondsElapsedTotal.current = update.total;
          secondsElapsedFirst.current = update.first;
          secondsElapsedSecond.current = update.second;
          secondsElapsedThird.current = update.third;
          secondsElapsedActive.current = update.active;
          activeTimerRef.current = update.activeTimer;

          pendingTimerUpdate.current = null;
          forceUpdate({});
          lastUpdateTimeRef.current = currentTime;
        }
      } else {
        // Re-schedule if we're updating too frequently
        scheduleUIUpdate();
      }
    });
  };

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
        history,
        displayConditionalNotification,
        setRunningState,
        setStartTime,
        ApplicationSettings,
        Keyset,
        endingProcessedRef,
        wakelockRef,
        mutateSessionOutcomes,
        mutateSettings,
        Group,
        Individual,
        Evaluation,
        Handle,
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
  }, [Settings, Keyset]);

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
    }),
  );

  // Note: Potentially not worth complexity
  const keySetSpecialKeys = useMemo(() => {
    const specialKeys = Keyset.SpecialDurationKeys;
    return specialKeys;
  }, [Keyset]);

  // Note: Potentially not worth complexity
  const keySetDurationKeys = useMemo(() => {
    const durationKeys = Keyset.DurationKeys;
    return durationKeys;
  }, [Keyset]);

  // Note: Potentially not worth complexity
  const keySetScoredDurationKeys = useMemo(() => {
    const durationKeys = Keyset.ScorableDurationKeys;
    return durationKeys;
  }, [Keyset]);

  // Note: Potentially not worth complexity
  const totalDurationKeys = useMemo(() => {
    return [...keySetDurationKeys, ...keySetScoredDurationKeys];
  }, [keySetDurationKeys, keySetScoredDurationKeys]);

  // Calculate count of active duration keys (keys with odd press counts)
  const activeDurationKeysCountMemo = useMemo(() => {
    return totalDurationKeys.filter((key) => {
      const matchingKeys = keysPressed.filter((pressedKey) => pressedKey.KeyCode === key.KeyCode);
      return matchingKeys.length % 2 === 1; // Odd count means key is active
    }).length;
  }, [totalDurationKeys, keysPressed]);

  // Update active duration keys count state
  useEffect(() => {
    setActiveDurationKeysCount(activeDurationKeysCountMemo);
  }, [activeDurationKeysCountMemo]);

  const HeaderComponent = useMemo(() => {
    return <SessionHeaderComponent Settings={Settings} RunningState={runningState} KeySet={Keyset} />;
  }, [Settings, runningState, Keyset]);

  const FrequencyCountsSummary = useMemo(() => {
    return <SessionRecorderFrequencyTallies Keyset={Keyset} KeysPressed={keysPressed} Settings={ApplicationSettings} />;
  }, [Keyset, keysPressed, ApplicationSettings]);

  // Use a timestamp state to force re-renders when duration keys are active
  const [durationUpdateTimestamp, setDurationUpdateTimestamp] = useState<number>(0);

  // Note: Hate this, but it works
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (activeDurationKeysCount > 0 && runningState === 'Started') {
      intervalId = setInterval(() => {
        setDurationUpdateTimestamp(Date.now());
      }, UI_POLL_INTERVAL);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeDurationKeysCount, runningState]);

  const DurationCountsSummary = useMemo(() => {
    return <SessionRecorderDurationTallies Keyset={Keyset} KeysPressed={keysPressed} Settings={ApplicationSettings} />;
  }, [Keyset, keysPressed, ApplicationSettings, activeDurationKeysCount > 0 ? durationUpdateTimestamp : null]);

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
                <TableHead className="h-9">{key.KeyName}</TableHead>
                <TableHead className="h-9">{key.KeyDescription}</TableHead>
                <TableHead className="h-9">{key.KeyScheduleRecording}</TableHead>
                <TableHead className="h-9">
                  {formatTimeOfDay(key.TimePressed)} ({key.TimeIntoSession.toFixed(2)}s)
                </TableHead>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    );
  }, [keysPressed]);

  return (
    <div className="flex flex-col w-full gap-4">
      {HeaderComponent}

      <div className="grid grid-cols-2 w-full gap-4 select-none">
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
