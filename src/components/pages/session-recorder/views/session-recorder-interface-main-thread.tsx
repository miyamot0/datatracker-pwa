import PageWrapper from '@/components/elements/page-wrapper';
import { useEventListener } from '@/components/elements/event-listeners';
import { SavedSessionResult, SavedSettings } from '@/lib/dtos';
import { cn } from '@/lib/utils';
import { KeySet } from '@/types/keyset';
import { useState, useRef, useEffect, useContext } from 'react';
import { toast } from 'sonner';
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
import { useNavigate } from '@tanstack/react-router';
import { mutationSettingsOutcomes } from '@/queries/outcomes/mutate-session-outcomes';
import { TRANSITION_CLASSES } from '@/types/transitions';
import { KeyManageType, KeyTiming, TimerSetting } from '@/types/timing';

type Props = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Keyset: KeySet;
  Settings: SavedSettings;
};

// Time in MS
const TIME_DELTA = 50;
const TIME_UNIT = 1000;

// Increment--Proportional to seconds change
const INCREMENT = TIME_DELTA / TIME_UNIT;

/**
 * SessionRecorderInterfaceMainThread component is responsible for managing the session recording process on the main thread
 * @param Group - The group identifier for the session
 * @param Individual - The individual identifier for the session
 * @param Evaluation - The evaluation identifier for the session
 * @param Keyset - The keyset configuration for the session, including frequency and duration keys
 * @param Settings - The session settings, including role, timer options, and other configurations
 * @returns - The rendered session recorder interface, which includes instructions, key history listing, and tallies of key presses, while managing the recording state and handling user interactions for starting, stopping, and saving session data.
 * @deprecated
 */
export default function SessionRecorderInterfaceMainThread({ Group, Individual, Evaluation, Keyset, Settings }: Props) {
  //const navigator_ = useNavigate();
  const { settings: applicationSettings, handle } = useContext(FolderHandleContext);
  const navigate = useNavigate({ from: '/session/$group/$individual/$evaluation/run/$keyset' });

  const [keysPressed, setKeysPressed] = useState<KeyManageType[]>([]);
  const [systemKeysPressed, setSystemKeysPressed] = useState<KeyManageType[]>([]);

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setTickCount] = useState<number>(0);

  const secondsElapsedTotal = useRef<number>(0);
  const secondsElapsedFirst = useRef<number>(0);
  const secondsElapsedSecond = useRef<number>(0);
  const secondsElapsedThird = useRef<number>(0);

  const secondsElapsedActive = useRef<number>(0);

  const wakelockRef = useRef<WakeLockSentinel>();
  const endingProcessedRef = useRef<boolean>(false);

  const [runningState, setRunningState] = useState<'Not Started' | 'Started' | 'Completed' | 'Cancelled'>(
    'Not Started',
  );

  const [startTime, setStartTime] = useState<Date | null>(null);

  const totalTimerRef = useRef<NodeJS.Timeout>();
  const activeTimerRef = useRef<TimerSetting>('Stopped');

  useEffect(() => {
    if (!handle) {
      navigate({ to: '/dashboard' });
      return;
    }

    if (runningState === 'Completed' || runningState === 'Cancelled') {
      // Prevent multiple executions for the same state change
      if (endingProcessedRef.current) {
        return;
      }

      endingProcessedRef.current = true;

      const save_output = async () => {
        if (!startTime) throw new Error('No start time found.');

        const ended_early = runningState === 'Cancelled';

        const final_system_keys = [
          ...systemKeysPressed,
          {
            KeyName: activeTimerRef.current,
            KeyCode: 0,
            KeyDescription: `End of ${activeTimerRef.current}`,
            TimePressed: new Date(),
            KeyScheduleRecording: activeTimerRef.current as KeyTiming,
            KeyType: 'System',
            TimeIntoSession: secondsElapsedTotal.current,
            ScheduleIndicator: 'End',
          } satisfies KeyManageType,
          {
            KeyName: 'Escape',
            KeyCode: 0,
            KeyDescription: 'End of Session',
            TimePressed: new Date(),
            KeyScheduleRecording: activeTimerRef.current as KeyTiming,
            KeyType: 'System',
            TimeIntoSession: secondsElapsedTotal.current,
            ScheduleIndicator: 'End',
          } satisfies KeyManageType,
        ];

        if (ended_early) {
          const confirm_save = window.confirm(
            'This session was terminated early. If you would like to save the results, click "OK", otherwise click "Cancel" to discard the session and return to the session overview to re-attempt the session.',
          );

          if (confirm_save === false) {
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

            return;
          }
        }

        const sessionFileToSave = {
          SessionSettings: Settings,
          FrequencyKeyPresses: keysPressed.filter((key) => key.KeyType === 'Frequency'),
          DurationKeyPresses: keysPressed.filter((key) => key.KeyType === 'Duration'),
          SystemKeyPresses: final_system_keys,
          SessionStart: startTime!.toJSON(),
          Keyset: Keyset,
          SessionEnd: new Date().toJSON(),
          EndedEarly: ended_early,
          TimerMain: secondsElapsedTotal.current,
          TimerOne: secondsElapsedFirst.current,
          TimerTwo: secondsElapsedSecond.current,
          TimerThree: secondsElapsedThird.current,
        } satisfies SavedSessionResult;

        secondsElapsedTotal.current += INCREMENT;

        if (wakelockRef.current) wakelockRef.current.release();
        wakelockRef.current = undefined;

        try {
          await mutateSessionOutcomes.mutateAsync({
            Handle: handle!,
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
            Handle: handle!,
            Settings: {
              ...Settings,
              Session: Settings.Session + 1,
            },
          });

          switch (applicationSettings.PostSessionBx) {
            case 'AutoAdvance':
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

              break;

            case 'AwaitInput':
              toast('Session has been recorded.', {
                description: 'Click button to queue session.',
                duration: 60000,
                action: {
                  label: 'Load Next Session',
                  onClick: () => {
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
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    () => {
      clearInterval(totalTimerRef.current);

      if (wakelockRef.current) wakelockRef.current.release();
      wakelockRef.current = undefined;
    };
  }, [
    runningState,
    keysPressed,
    Settings,
    handle,
    navigate,
    Group,
    Individual,
    Evaluation,
    applicationSettings,
    startTime,
    systemKeysPressed,
    Keyset,
    mutateSettings,
  ]);

  function registerListener(timer: 'Primary' | 'Secondary' | 'Tertiary') {
    /**
     * Firing here on the *switch* between schedules
     */
    if (totalTimerRef.current) {
      const end_prev = {
        KeyName: activeTimerRef.current,
        KeyCode: 0,
        KeyDescription: `End of ${activeTimerRef.current}`,
        TimePressed: new Date(),
        KeyScheduleRecording: activeTimerRef.current as KeyTiming,
        KeyType: 'System',
        TimeIntoSession: secondsElapsedTotal.current,
        ScheduleIndicator: 'End',
      } satisfies KeyManageType;

      activeTimerRef.current = timer;

      setSystemKeysPressed([
        ...systemKeysPressed,
        end_prev,
        {
          KeyName: activeTimerRef.current,
          KeyCode: 0,
          KeyDescription: `Start of ${timer}`,
          TimePressed: new Date(),
          KeyScheduleRecording: timer as KeyTiming,
          KeyType: 'System',
          ScheduleIndicator: 'Start',
          TimeIntoSession: secondsElapsedTotal.current,
        } satisfies KeyManageType,
      ]);

      return;
    }

    totalTimerRef.current = setInterval(() => {
      if (
        Settings.TimerOption === 'End on Primary Timer' &&
        secondsElapsedTotal.current + INCREMENT >= Settings.DurationS
      ) {
        clearInterval(totalTimerRef.current);
        setRunningState('Completed');

        return;
      } else if (
        Settings.TimerOption === 'End on Timer #1' &&
        secondsElapsedFirst.current + INCREMENT >= Settings.DurationS
      ) {
        clearInterval(totalTimerRef.current);
        setRunningState('Completed');

        return;
      } else if (
        Settings.TimerOption === 'End on Timer #2' &&
        secondsElapsedSecond.current + INCREMENT >= Settings.DurationS
      ) {
        clearInterval(totalTimerRef.current);
        setRunningState('Completed');

        return;
      } else if (
        Settings.TimerOption === 'End on Timer #3' &&
        secondsElapsedThird.current + INCREMENT >= Settings.DurationS
      ) {
        clearInterval(totalTimerRef.current);
        setRunningState('Completed');

        return;
      }

      secondsElapsedTotal.current += INCREMENT;
      secondsElapsedActive.current += INCREMENT;

      switch (activeTimerRef.current) {
        case 'Primary':
          secondsElapsedFirst.current += INCREMENT;

          break;
        case 'Secondary':
          secondsElapsedSecond.current += INCREMENT;

          break;
        case 'Tertiary':
          secondsElapsedThird.current += INCREMENT;

          break;
      }

      setTickCount((prev) => prev + 1);
    }, TIME_DELTA);
  }

  // Note: Z/X/C for Timers 1/2/3
  useEventListener('keydown', (ev: React.KeyboardEvent<HTMLElement>) => {
    if (ev.repeat) {
      return;
    }

    if (ev.key === 'Space' || ev.key === ' ') {
      ev.preventDefault();
    }

    if (!totalTimerRef.current) {
      if (ev.key === 'Enter' && runningState === 'Not Started') {
        //setActiveTimer("Primary");
        activeTimerRef.current = 'Primary';
        registerListener('Primary');

        setRunningState('Started');
        setStartTime(new Date());

        // Reset the ending processed flag for new session
        endingProcessedRef.current = false;

        setSystemKeysPressed([
          ...systemKeysPressed,
          {
            KeyName: ev.key,
            KeyCode: ev.keyCode,
            KeyDescription: 'Start of Session',
            TimePressed: new Date(),
            KeyScheduleRecording: activeTimerRef.current as KeyTiming,
            KeyType: 'System',
            TimeIntoSession: secondsElapsedTotal.current,
            ScheduleIndicator: 'Start',
          } satisfies KeyManageType,
          {
            KeyName: 'Primary',
            KeyCode: 0,
            KeyDescription: 'Start of Primary',
            TimePressed: new Date(),
            KeyScheduleRecording: 'Primary' as KeyTiming,
            KeyType: 'System',
            TimeIntoSession: secondsElapsedTotal.current,
            ScheduleIndicator: 'Start',
          } satisfies KeyManageType,
        ]);

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

    if (ev.key === 'Escape') {
      setRunningState('Cancelled');

      clearInterval(totalTimerRef.current);
    }

    if (ev.key === 'z' && activeTimerRef.current !== 'Primary') {
      secondsElapsedActive.current = 0;
      registerListener('Primary');
      return;
    }

    if (ev.key === 'x' && activeTimerRef.current !== 'Secondary') {
      secondsElapsedActive.current = 0;
      registerListener('Secondary');
      return;
    }

    if (ev.key === 'c' && activeTimerRef.current !== 'Tertiary') {
      secondsElapsedActive.current = 0;
      registerListener('Tertiary');
      return;
    }

    if (ev.key === 'Backspace' || ev.key === 'Delete') {
      if (keysPressed.length === 0) return;

      setKeysPressed((keysPressed) => keysPressed.slice(0, keysPressed.length - 1));

      return;
    }

    const is_freq = Keyset.FrequencyKeys.some((key) => key.KeyCode === ev.keyCode);
    const is_dur = Keyset.DurationKeys.some((key) => key.KeyCode === ev.keyCode);

    if (is_freq || is_dur) {
      if (is_freq) {
        const freq_key = Keyset.FrequencyKeys.find((key) => key.KeyCode === ev.keyCode);

        if (!freq_key) return;

        setKeysPressed([
          ...keysPressed,
          {
            KeyName: freq_key.KeyName,
            KeyCode: freq_key.KeyCode,
            KeyDescription: freq_key.KeyDescription,
            TimePressed: new Date(),
            KeyScheduleRecording: activeTimerRef.current as KeyTiming,
            KeyType: 'Frequency',
            TimeIntoSession: secondsElapsedTotal.current,
          } satisfies KeyManageType,
        ]);
      }

      if (is_dur) {
        const freq_key = Keyset.DurationKeys.find((key) => key.KeyCode === ev.keyCode);

        if (!freq_key) return;

        setKeysPressed([
          ...keysPressed,
          {
            KeyName: freq_key.KeyName,
            KeyCode: freq_key.KeyCode,
            KeyDescription: freq_key.KeyDescription,
            TimePressed: new Date(),
            KeyScheduleRecording: activeTimerRef.current as KeyTiming,
            KeyType: 'Duration',
            TimeIntoSession: secondsElapsedTotal.current,
          } satisfies KeyManageType,
        ]);
      }
    }
  });

  if (!handle) return null;

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
        BuildSessionDesignerBreadcrumb(Group, Individual, Evaluation),
      ]}
      label={`Record ${Evaluation} Session`}
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
            Running={!!totalTimerRef.current}
          />
        </div>
      </div>
    </PageWrapper>
  );
}
