import PageWrapper from '@/components/layout/page-wrapper';
import { useEventListener } from '@/components/session-recorder/helpers/event-listeners';
import { SavedSessionResult, SavedSettings } from '@/lib/dtos';
import { cn } from '@/lib/utils';
import { KeySet } from '@/types/keyset';
import { useState, useRef, useEffect, useContext } from 'react';
import { KeyManageType, TimerSetting } from '../types/session-recorder-types';
import { toast } from 'sonner';
import SessionRecorderWorker from '@/workers/session-recorder-worker.ts?worker';
import type { WorkerMessage, WorkerResponse } from '@/workers/session-recorder-worker';
import SessionRecorderInstructions from './ui-instructions';
import KeyHistoryListing from './ui-key-listing';
import SessionRecorderTallies from './ui-counts';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildSessionDesignerBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { displayConditionalNotification } from '@/lib/notifications';
import { FolderHandleContext } from '@/context/folder-context';
import { useMutation } from '@tanstack/react-query';
import { mutationSettingsParams } from '@/queries/session/mutate-session-params';
import { queryClient } from '@/App';
import { useRouter } from '@tanstack/react-router';
import { mutationSettingsOutcomes } from '@/queries/outcomes/mutate-session-outcomes';

type Props = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Keyset: KeySet;
  Settings: SavedSettings;
  Handle: FileSystemDirectoryHandle;
};

export default function SessionRecorderInterface({ Group, Individual, Evaluation, Keyset, Settings, Handle }: Props) {
  const { settings: applicationSettings } = useContext(FolderHandleContext);
  const { history } = useRouter();
  //const navigate = useNavigate({ from: '/session/$group/$individual/$evaluation/run/$keyset' });
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

  // Pending state for smooth updates
  const pendingTimerUpdate = useRef<any>(null);

  const wakelockRef = useRef<WakeLockSentinel>();
  const endingProcessedRef = useRef<boolean>(false);

  const [runningState, setRunningState] = useState<'Not Started' | 'Started' | 'Completed' | 'Cancelled'>(
    'Not Started',
  );
  const [_startTime, setStartTime] = useState<Date | null>(null);
  const activeTimerRef = useRef<TimerSetting>('Stopped');
  const [, forceUpdate] = useState({});

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
      payload: { settings: Settings, keyset: Keyset, uiPollingInterval: applicationSettings.RecorderPolling },
    };
    workerRef.current.postMessage(initMessage);

    // Handle high-frequency updates via MessageChannel
    messageChannelRef.current.port1.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, payload } = event.data;

      if (type === 'HIGH_FREQ_UPDATE') {
        pendingTimerUpdate.current = payload;
        scheduleUIUpdate();
      }
    };

    // Handle worker messages
    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'TIMER_UPDATE':
          // Fallback for when MessageChannel isn't available
          pendingTimerUpdate.current = payload;
          scheduleUIUpdate();
          break;

        case 'KEY_PROCESSED':
          setKeysPressed((prev) => [...prev, payload.key]);
          break;

        case 'KEY_DELETED':
          setKeysPressed((prev) => prev.slice(0, -1));
          break;

        case 'SYSTEM_EVENT':
          if (payload.events) {
            // System events are handled by worker, we just need to update timer state
          }
          if (payload.activeTimer) {
            activeTimerRef.current = payload.activeTimer;
          }
          if (payload.isRunning !== undefined) {
            setRunningState(payload.isRunning ? 'Started' : 'Not Started');
          }
          break;

        case 'SESSION_ENDED':
          handleSessionEnded(payload);
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

  const handleSessionEnded = async (payload: any) => {
    const {
      reason,
      keysPressed: finalKeys,
      systemKeysPressed: finalSystemKeys,
      timers,
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
          /*
          navigate({
            to: '/session/$group/$individual/$evaluation',
            params: {
              group: Group,
              individual: Individual,
              evaluation: Evaluation,
            },
            viewTransition: {
              types: () => {
                const animTypes = TRANSITION_CLASSES[applicationSettings.TransitionBehavior];

                if (animTypes.length < 2) {
                  return false;
                }

                return [animTypes[1]];
              },
            },
          });
          */

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

        switch (applicationSettings.PostSessionBx) {
          case 'AutoAdvance':
            history.go(-1);
            /*
            navigate({
              to: '/session/$group/$individual/$evaluation',
              params: {
                group: Group,
                individual: Individual,
                evaluation: Evaluation,
              },
              viewTransition: {
                types: () => {
                  const animTypes = TRANSITION_CLASSES[applicationSettings.TransitionBehavior];

                  if (animTypes.length < 2) {
                    return false;
                  }

                  return [animTypes[1]];
                },
              },
            });
            */

            break;

          case 'AwaitInput':
            toast('Session has been recorded.', {
              description: 'Click button to queue session.',
              duration: 60000,
              action: {
                label: 'Load Next Session',
                onClick: () => {
                  history.go(-1);
                  /*
                  navigate({
                    to: '/session/$group/$individual/$evaluation',
                    params: {
                      group: Group,
                      individual: Individual,
                      evaluation: Evaluation,
                    },
                    viewTransition: {
                      types: () => {
                        const animTypes = TRANSITION_CLASSES[applicationSettings.TransitionBehavior];

                        if (animTypes.length < 1) {
                          return false;
                        }

                        return [animTypes[animTypes.length - 1]];
                      },
                    },
                  });
                  */
                },
              },
            });

            break;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        displayConditionalNotification(
          applicationSettings,
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

    if (!workerRef.current) return;

    if (ev.key === 'Escape') {
      const message: WorkerMessage = {
        type: 'STOP_SESSION',
        payload: { reason: 'Cancelled' },
      };
      workerRef.current.postMessage(message);
      return;
    }

    if (ev.key === 'z' && activeTimerRef.current !== 'Primary') {
      switchTimer('Primary');
      return;
    }

    if (ev.key === 'x' && activeTimerRef.current !== 'Secondary') {
      switchTimer('Secondary');
      return;
    }

    if (ev.key === 'c' && activeTimerRef.current !== 'Tertiary') {
      switchTimer('Tertiary');
      return;
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

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
        BuildSessionDesignerBreadcrumb(Group, Individual, Evaluation),
      ]}
      className="select-none"
    >
      <div className="flex flex-col w-full gap-4">
        <div className="w-full flex flex-row justify-between select-none">
          <div className="flex-1 flex flex-row">
            <p
              className={cn(
                'transition-colors bg-transparent rounded-full px-2 text-sm flex items-center w-fit whitespace-nowrap',
                {
                  'bg-green-600 text-white': Settings.Role === 'Primary',
                  'bg-purple-400 text-white': Settings.Role === 'Reliability',
                },
              )}
            >
              {`${Settings.Role} Data Collector`}
            </p>
            <p
              className={cn(
                'mx-2 transition-colors bg-transparent rounded-full px-2 text-sm flex items-center w-fit whitespace-nowrap',
                {
                  'bg-gray-600 text-white': Settings.TimerOption === 'End on Primary Timer',
                  'bg-green-400 text-white': Settings.TimerOption === 'End on Timer #1',
                  'bg-orange-400 text-white': Settings.TimerOption === 'End on Timer #2',
                  'bg-red-400 text-white': Settings.TimerOption === 'End on Timer #3',
                  //'bg-blue-400 text-white': Settings.TimerOption === 'End on Timer #1 and #2 Total',
                },
              )}
            >
              {Settings.TimerOption} ({Settings.DurationS}s)
            </p>
          </div>
          <div className="flex-1 flex flex-row justify-center items-center text-center font-bold whitespace-nowrap">
            <p className="flex-1">{`Session #${Settings.Session}`}</p>
          </div>
          <div className="flex-1 flex flex-row justify-end whitespace-nowrap">
            <p
              className={cn('transition-colors bg-transparent rounded-full px-2 text-sm flex items-center w-fit', {
                'bg-gray-600 text-white': runningState === 'Not Started',
                'bg-blue-400 text-white': runningState === 'Started',
                'bg-green-400 text-white': runningState === 'Completed',
              })}
            >
              {runningState}
            </p>
          </div>
        </div>

        <SessionRecorderTallies KeysPressed={keysPressed} Keyset={Keyset} Settings={applicationSettings} />

        <div className="grid grid-cols-2 w-full gap-4 select-none">
          <SessionRecorderInstructions {...{ Evaluation, Settings }} />
          <KeyHistoryListing
            KeysPressed={keysPressed}
            SecondsElapsed={secondsElapsedTotal.current}
            SecondsElapsedFirst={secondsElapsedFirst.current}
            SecondsElapsedSecond={secondsElapsedSecond.current}
            SecondsElapsedThird={secondsElapsedThird.current}
            SecondsElapsedDelta={secondsElapsedActive.current}
            ActiveTimer={activeTimerRef.current}
            Running={runningState === 'Started'}
          />
        </div>
      </div>
    </PageWrapper>
  );
}
