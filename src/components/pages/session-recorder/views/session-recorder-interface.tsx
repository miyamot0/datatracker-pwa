import { useEventListener } from '@/components/elements/event-listeners';
import { SavedSessionResult, SavedSettings } from '@/lib/dtos';
import { KeySet } from '@/types/keyset';
import { useState, useRef, useEffect, useMemo } from 'react';
import { KeyManageType, TimerSetting } from '@/types/timing';
import { toast } from 'sonner';
import SessionRecorderWorker from '@/workers/timing/session-recorder-worker.ts?worker';
import SessionRecorderInstructions from './ui-instructions';
import KeyHistoryListing from './ui-key-listing';
import { displayConditionalNotification } from '@/lib/notifications';
import { useMutation } from '@tanstack/react-query';
import { mutationSettingsParams } from '@/queries/session/mutate-session-params';
import { queryClient } from '@/App';
import { useRouter } from '@tanstack/react-router';
import { mutationSettingsOutcomes } from '@/queries/outcomes/mutate-session-outcomes';
import {
  KeyProcessedPayload,
  SessionEndedPayload,
  SystemEventPayload,
  TimerUpdatePayload,
} from '@/workers/timing/types/session-recorder-worker-payloads';
import { WorkerMessage, WorkerResponse } from '@/workers/timing/types/session-recorder-worker-messaging';
import { ApplicationSettingsTypes, SessionPollingIntervals } from '@/types/settings';
import SessionRecorderFrequencyTallies from './ui-counts-frequency';
import SessionRecorderDurationTallies from './ui-counts-duration';
import SessionHeaderComponent from '../subpanels/header-component';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatTimeOfDay } from '@/lib/time';

type Props = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Keyset: KeySet;
  Settings: SavedSettings;
  Handle: FileSystemDirectoryHandle;
  ApplicationSettings: ApplicationSettingsTypes;
};

export type RunningStateOptions = 'Not Started' | 'Started' | 'Completed' | 'Cancelled';

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
    onSuccess: (data) => {
      queryClient.setQueryData(['/', Group, Individual, Evaluation, 'outcomes'], data);
    },
  });

  const mutateSettings = useMutation({
    mutationFn: mutationSettingsParams,
    onSuccess: async (data) => {
      queryClient.setQueryData(['/', Group, Individual, Evaluation, 'settings'], data);

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

    // Handle high-frequency updates via MessageChannel
    messageChannelRef.current.port1.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, payload } = event.data;

      if (type === 'HIGH_FREQ_UPDATE' && payload) {
        pendingTimerUpdate.current = payload as TimerUpdatePayload;
        // Update special key timers
        if (payload.specialKeyTimers) {
          specialKeyTimers.current = payload.specialKeyTimers;
        }
        if (payload.activeSpecialKey !== undefined) {
          activeSpecialKey.current = payload.activeSpecialKey;
        }
        scheduleUIUpdate();
      }
    };

    // Handle worker messages
    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'TIMER_UPDATE':
          // Fallback for when MessageChannel isn't available
          if (payload) {
            pendingTimerUpdate.current = payload as TimerUpdatePayload;
            // Update special key timers
            if (payload.specialKeyTimers) {
              specialKeyTimers.current = payload.specialKeyTimers;
            }
            if (payload.activeSpecialKey !== undefined) {
              activeSpecialKey.current = payload.activeSpecialKey;
            }
            scheduleUIUpdate();
          }
          break;

        case 'KEY_PROCESSED':
          setKeysPressed((prev) => [...prev, (payload as KeyProcessedPayload).key]);
          break;

        case 'KEY_DELETED':
          setKeysPressed((prev) => prev.slice(0, -1));
          break;

        case 'SYSTEM_EVENT': {
          const systemPayload = payload as SystemEventPayload;
          if (systemPayload.events) {
            // System events are handled by worker, we just need to update timer state
          }
          if (systemPayload.activeTimer) {
            activeTimerRef.current = systemPayload.activeTimer;
          }
          if (systemPayload.activeSpecialKey !== undefined) {
            activeSpecialKey.current = systemPayload.activeSpecialKey;
          }
          if (systemPayload.isRunning !== undefined) {
            setRunningState(systemPayload.isRunning ? 'Started' : 'Not Started');
          }
          break;
        }

        case 'SESSION_ENDED':
          if (payload) {
            handleSessionEnded(payload as SessionEndedPayload);
          }
          break;
      }
    };

    // Cleanup worker on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (messageChannelRef.current) {
        messageChannelRef.current.port1.close();
        messageChannelRef.current = null;
      }
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (wakelockRef.current) {
        wakelockRef.current.release();
        wakelockRef.current = undefined;
      }
    };
  }, [Settings, Keyset]);

  const handleSessionEnded = async (payload: SessionEndedPayload) => {
    const {
      reason,
      keysPressed: finalKeys,
      systemKeysPressed: finalSystemKeys,
      timers,
      specialKeyTimers,
      startTime: sessionStartTime,
    } = payload;

    // Prevent multiple executions for the same session end
    if (endingProcessedRef.current) {
      return;
    }

    endingProcessedRef.current = true;

    const save_output = async () => {
      if (!sessionStartTime) throw new Error('No start time found.');

      setRunningState(reason);
      const ended_early = reason === 'Cancelled';
      const sessionStart = new Date(sessionStartTime);
      setStartTime(sessionStart);

      if (ended_early) {
        const confirm_save = window.confirm(
          'This session was terminated early. If you would like to save the results, click "OK", otherwise click "Cancel" to discard the session and return to the session overview to re-attempt the session.',
        );

        if (confirm_save === false) {
          history.go(-1);

          return;
        }
      }

      const sessionFileToSave = {
        SessionSettings: Settings,
        FrequencyKeyPresses: finalKeys.filter((key: KeyManageType) => key.KeyType === 'Frequency'),
        DurationKeyPresses: finalKeys.filter((key: KeyManageType) => key.KeyType === 'Duration'),
        SystemKeyPresses: finalSystemKeys,
        SessionStart: sessionStart.toJSON(),
        Keyset: Keyset,
        SessionEnd: new Date().toJSON(),
        EndedEarly: ended_early,
        TimerMain: timers.total,
        TimerOne: timers.first,
        TimerTwo: timers.second,
        TimerThree: timers.third,
        SpecialKeyTimers: specialKeyTimers || {},
      } satisfies SavedSessionResult;

      if (wakelockRef.current) wakelockRef.current.release();
      wakelockRef.current = undefined;

      try {
        await mutateSessionOutcomes.mutateAsync({
          Handle,
          Group,
          Individual,
          Evaluation,
          NewOutcome: sessionFileToSave,
          Outcomes: [],
          Action: 'Add',
        });

        await mutateSettings.mutateAsync({
          Group,
          Individual,
          Evaluation,
          Handle,
          Settings: {
            ...Settings,
            Session: Settings.Session + 1,
          },
        });

        switch (ApplicationSettings.PostSessionBx) {
          case 'AutoAdvance':
            history.go(-1);

            break;

          case 'AwaitInput':
            toast('Session has been recorded.', {
              description: 'Click button to queue session.',
              duration: 60000,
              action: {
                label: 'Load Next Session',
                onClick: () => {
                  history.go(-1);
                },
              },
            });

            break;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        displayConditionalNotification(
          ApplicationSettings,
          'Error Saving Results',
          'An error occurred while saving the results. Please try again.',
          3000,
          true,
        );
      }
    };

    save_output();
  };

  const switchTimer = (timer: 'Primary' | 'Secondary' | 'Tertiary') => {
    if (!workerRef.current) return;

    const message: WorkerMessage = {
      type: 'SWITCH_TIMER',
      payload: { timer },
    };
    workerRef.current.postMessage(message);
  };

  const switchToSpecialKey = (keyName: string) => {
    if (!workerRef.current) return;

    const message: WorkerMessage = {
      type: 'SWITCH_SPECIAL_KEY',
      payload: { specialKeyName: keyName },
    };
    workerRef.current.postMessage(message);
  };

  // Note: Z/X/C for Timers 1/2/3
  useEventListener('keydown', (ev: React.KeyboardEvent<HTMLElement>) => {
    if (ev.repeat) {
      return;
    }

    if (ev.key === 'Space' || ev.key === ' ') {
      ev.preventDefault();
    }

    if (runningState === 'Not Started') {
      if (ev.key === 'Escape') {
        history.go(-1);
      }

      if (ev.key === 'Enter') {
        if (!workerRef.current) return;

        // Reset the ending processed flag for new session
        endingProcessedRef.current = false;

        // Start session in worker
        const message: WorkerMessage = {
          type: 'START_SESSION',
        };
        workerRef.current.postMessage(message);

        setStartTime(new Date());

        // Request wake-lock
        const request_wake_lock = async () => {
          if (navigator && navigator.wakeLock) {
            wakelockRef.current = await navigator.wakeLock.request('screen');
          }
        };

        request_wake_lock();

        toast('Session started recording.', {
          dismissible: true,
        });
      }

      return;
    }

    // Allow escape to go back after a successful session completion
    if (runningState === 'Completed') {
      if (ev.key === 'Escape') {
        history.go(-1);
        return;
      }
    }

    if (!workerRef.current) return;

    if (ev.key === 'Escape') {
      const message: WorkerMessage = {
        type: 'STOP_SESSION',
        payload: { reason: 'Cancelled' },
      };
      workerRef.current.postMessage(message);
      return;
    }

    if (ev.key === 'z') {
      // Allow switch to Primary from any current state
      switchTimer('Primary');
      return;
    }

    if (ev.key === 'x' && ApplicationSettings.TimerTwoDisplay === 'show') {
      // Allow switch to Secondary from any current state
      switchTimer('Secondary');
      return;
    }

    if (ev.key === 'c' && ApplicationSettings.TimerThreeDisplay === 'show') {
      // Allow switch to Tertiary from any current state
      switchTimer('Tertiary');
      return;
    }

    // Handle special duration key switches (using actual key names)
    if (runningState === 'Started') {
      const specialKeys = Keyset.SpecialDurationKeys;
      const matchingSpecialKey = specialKeys.find((key) => key.KeyName.toLowerCase() === ev.key.toLowerCase());

      if (matchingSpecialKey) {
        // Switch to special key timer
        switchToSpecialKey(matchingSpecialKey.KeyName);
        return;
      }
    }

    if (ev.key === 'Backspace' || ev.key === 'Delete') {
      if (keysPressed.length === 0) return;

      const message: WorkerMessage = {
        type: 'DELETE_LAST_KEY',
      };
      workerRef.current.postMessage(message);
      return;
    }

    // Send key press to worker for processing
    const message: WorkerMessage = {
      type: 'PROCESS_KEY',
      payload: {
        keyName: ev.key,
        keyCode: ev.keyCode,
      },
    };
    workerRef.current.postMessage(message);
  });

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

  // Calculate count of active duration keys (keys with odd press counts)
  const activeDurationKeysCountMemo = useMemo(() => {
    return keySetDurationKeys.filter((key) => {
      const matchingKeys = keysPressed.filter((pressedKey) => pressedKey.KeyCode === key.KeyCode);
      return matchingKeys.length % 2 === 1; // Odd count means key is active
    }).length;
  }, [keySetDurationKeys, keysPressed]);

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
