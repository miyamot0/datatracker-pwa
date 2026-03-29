import { KeySet } from '@/types/keyset';
import { ApplicationSettingsTypes } from '@/types/settings';
import { KeyManageType, TimerSetting } from '@/types/timing';
import { WorkerMessage, WorkerResponse } from '@/workers/timing/types/session-recorder-worker-messaging';
import {
  KeyProcessedPayload,
  SessionEndedPayload,
  SystemEventPayload,
  TimerUpdatePayload,
} from '@/workers/timing/types/session-recorder-worker-payloads';
import { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { toast } from 'sonner';
import { SavedSessionResult, SavedSettings } from './dtos';
import { UseMutationResult } from '@tanstack/react-query';
import { ModifiedSessionResult } from '@/types/storage';
import { RunningStateOptions } from '@/types/session';
import { RouterHistory } from '@tanstack/react-router';

/**
 * Handles incoming messages from the session recorder worker, updating state and processing session end logic as needed.
 *
 * @param event - The message event received from the worker, containing the type of message and associated payload.
 * @param param1 - An object containing various state management functions, refs, and data needed to handle the worker messages appropriately.
 * @returns void
 */
export function handleMessageChannel(
  event: MessageEvent<WorkerResponse>,
  {
    pendingTimerUpdate,
    specialKeyTimers,
    activeSpecialKey,
    scheduleUIUpdate,
  }: {
    pendingTimerUpdate: MutableRefObject<TimerUpdatePayload | null>;
    specialKeyTimers: MutableRefObject<Record<string, number>>;
    activeSpecialKey: MutableRefObject<string | null>;
    scheduleUIUpdate: () => void;
  },
) {
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
}

/**
 * Handles the logic for when a session ends, including saving results, updating state, and navigating based on user settings.
 *
 * @param event - The message event received from the worker indicating the session has ended, containing the reason and final session data.
 * @param param1 - An object containing various state management functions, refs, and data needed to process the session end logic appropriately.
 * @returns void
 */
export function handleWorkerMessage(
  event: MessageEvent<WorkerResponse>,
  {
    Group,
    Individual,
    Evaluation,
    Keyset,
    Settings,
    Handle,
    ApplicationSettings,
    mutateSessionOutcomes,
    mutateSettings,
    history,
    displayConditionalNotification,
    setRunningState,
    setStartTime,
    wakelockRef,
    endingProcessedRef,
    pendingTimerUpdate,
    specialKeyTimers,
    activeSpecialKey,
    scheduleUIUpdate,
    setKeysPressed,
    activeTimerRef,
  }: {
    Group: string;
    Individual: string;
    Evaluation: string;
    Keyset: KeySet;
    Settings: SavedSettings;
    Handle: FileSystemDirectoryHandle;
    ApplicationSettings: ApplicationSettingsTypes;
    mutateSessionOutcomes: UseMutationResult<
      ModifiedSessionResult[],
      Error,
      {
        Group: string;
        Individual: string;
        Evaluation: string;
        Outcomes: ModifiedSessionResult[];
        ConditionRename?: string;
        UpdatedOutcome?: ModifiedSessionResult;
        PriorOutcome?: ModifiedSessionResult;
        NewOutcome?: SavedSessionResult;
        Handle: FileSystemDirectoryHandle;
        Action: 'Delete' | 'EditCondition' | 'Modify' | 'Add';
      },
      unknown
    >;
    mutateSettings: UseMutationResult<
      SavedSettings,
      Error,
      {
        Group: string;
        Individual: string;
        Evaluation: string;
        Settings: SavedSettings;
        Handle: FileSystemDirectoryHandle;
      },
      unknown
    >;
    history: RouterHistory;
    displayConditionalNotification: (
      settings: ApplicationSettingsTypes,
      title: string,
      description: string,
      duration?: number,
      isError?: boolean,
    ) => void;
    setRunningState: Dispatch<SetStateAction<RunningStateOptions>>;
    setStartTime: Dispatch<SetStateAction<Date | null>>;
    wakelockRef: MutableRefObject<WakeLockSentinel | undefined>;
    endingProcessedRef: MutableRefObject<boolean>;
    pendingTimerUpdate: MutableRefObject<TimerUpdatePayload | null>;
    specialKeyTimers: MutableRefObject<Record<string, number>>;
    activeSpecialKey: MutableRefObject<string | null>;
    scheduleUIUpdate: () => void;
    setKeysPressed: Dispatch<SetStateAction<KeyManageType[]>>;
    activeTimerRef: MutableRefObject<TimerSetting>;
  },
) {
  const { type, payload } = event.data;

  const getActiveTimerSeconds = (timers: SessionEndedPayload['timers']): number => {
    if (activeSpecialKey.current) {
      return specialKeyTimers.current[activeSpecialKey.current] || 0;
    }

    switch (activeTimerRef.current) {
      case 'Primary':
        return timers.first;
      case 'Secondary':
        return timers.second;
      case 'Tertiary':
        return timers.third;
      default:
        return timers.total;
    }
  };

  const getFinalTimerPayload = (sessionEndPayload: SessionEndedPayload): TimerUpdatePayload => {
    const finalPayload: TimerUpdatePayload = {
      total: sessionEndPayload.timers.total,
      first: sessionEndPayload.timers.first,
      second: sessionEndPayload.timers.second,
      third: sessionEndPayload.timers.third,
      active: getActiveTimerSeconds(sessionEndPayload.timers),
      activeTimer: activeTimerRef.current,
      specialKeyTimers: sessionEndPayload.specialKeyTimers || {},
      activeSpecialKey: activeSpecialKey.current,
    };

    // Clamp the endpoint timer when auto-completed so UI visibly lands on the configured duration.
    if (sessionEndPayload.reason === 'Completed') {
      if (Settings.TimerOption === 'End on Primary Timer') {
        finalPayload.total = Math.max(finalPayload.total, Settings.DurationS);
      } else if (Settings.TimerOption === 'End on Timer #1') {
        finalPayload.first = Math.max(finalPayload.first, Settings.DurationS);
      } else if (Settings.TimerOption === 'End on Timer #2') {
        finalPayload.second = Math.max(finalPayload.second, Settings.DurationS);
      } else if (Settings.TimerOption === 'End on Timer #3') {
        finalPayload.third = Math.max(finalPayload.third, Settings.DurationS);
      } else if (typeof Settings.TimerOption === 'number') {
        const specialKeyName = Keyset.SpecialDurationKeys.find((key) => key.KeyCode === Settings.TimerOption)?.KeyName;
        if (specialKeyName) {
          finalPayload.specialKeyTimers[specialKeyName] = Math.max(
            finalPayload.specialKeyTimers[specialKeyName] || 0,
            Settings.DurationS,
          );
        }
      }

      finalPayload.active = getActiveTimerSeconds({
        total: finalPayload.total,
        first: finalPayload.first,
        second: finalPayload.second,
        third: finalPayload.third,
      });
    }

    return finalPayload;
  };

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
        const sessionEndPayload = payload as SessionEndedPayload;
        specialKeyTimers.current = sessionEndPayload.specialKeyTimers || {};
        pendingTimerUpdate.current = getFinalTimerPayload(sessionEndPayload);
        scheduleUIUpdate();

        handleSessionEnded(payload as SessionEndedPayload, {
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
        });
      }
      break;
  }
}

/**
 * Handles the logic for when a session ends, including saving results, updating state, and navigating based on user settings.
 *
 * @param payload - The payload received from the worker indicating the session has ended, containing the reason and final session data.
 * @param param1 - An object containing various state management functions, refs, and data needed to process the session end logic appropriately.
 * @returns void
 */
export async function handleSessionEnded(
  payload: SessionEndedPayload,
  {
    Group,
    Individual,
    Evaluation,
    Keyset,
    Settings,
    Handle,
    ApplicationSettings,
    mutateSessionOutcomes,
    mutateSettings,
    history,
    displayConditionalNotification,
    setRunningState,
    setStartTime,
    wakelockRef,
    endingProcessedRef,
  }: {
    Group: string;
    Individual: string;
    Evaluation: string;
    Keyset: KeySet;
    Settings: SavedSettings;
    Handle: FileSystemDirectoryHandle;
    ApplicationSettings: ApplicationSettingsTypes;
    mutateSessionOutcomes: UseMutationResult<
      ModifiedSessionResult[],
      Error,
      {
        Group: string;
        Individual: string;
        Evaluation: string;
        Outcomes: ModifiedSessionResult[];
        ConditionRename?: string;
        UpdatedOutcome?: ModifiedSessionResult;
        PriorOutcome?: ModifiedSessionResult;
        NewOutcome?: SavedSessionResult;
        Handle: FileSystemDirectoryHandle;
        Action: 'Delete' | 'EditCondition' | 'Modify' | 'Add';
      },
      unknown
    >;
    mutateSettings: UseMutationResult<
      SavedSettings,
      Error,
      {
        Group: string;
        Individual: string;
        Evaluation: string;
        Settings: SavedSettings;
        Handle: FileSystemDirectoryHandle;
      },
      unknown
    >;
    history: RouterHistory; // Replace with actual type
    displayConditionalNotification: (
      settings: ApplicationSettingsTypes,
      title: string,
      description: string,
      duration?: number,
      isError?: boolean,
    ) => void;
    setRunningState: Dispatch<SetStateAction<RunningStateOptions>>;
    setStartTime: Dispatch<SetStateAction<Date | null>>;
    wakelockRef: MutableRefObject<WakeLockSentinel | undefined>;
    endingProcessedRef: MutableRefObject<boolean>;
  },
) {
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
}

/**
 * Sends a message to the session recorder worker to switch the active timer based on user keypresses, allowing for dynamic timer switching during a session.
 *
 * @param timer - The timer to switch to, which can be 'Primary', 'Secondary', or 'Tertiary'.
 * @param workerRef - A reference to the web worker handling the session recording.
 * @returns void
 */
export function switchTimer(timer: 'Primary' | 'Secondary' | 'Tertiary', workerRef: MutableRefObject<Worker | null>) {
  if (!workerRef.current) return;

  const message: WorkerMessage = {
    type: 'SWITCH_TIMER',
    payload: { timer },
  };
  workerRef.current.postMessage(message);
}

/**
 * Sends a message to the session recorder worker to switch to a special key timer based on user keypresses, allowing for dynamic switching to timers associated with specific keys during a session.
 *
 * @param keyName - The name of the special key timer to switch to, which should correspond to a key defined in the Keyset's SpecialDurationKeys.
 * @param workerRef - A reference to the web worker handling the session recording.
 * @returns void
 */
export function switchToSpecialKey(keyName: string, workerRef: MutableRefObject<Worker | null>) {
  if (!workerRef.current) return;

  const message: WorkerMessage = {
    type: 'SWITCH_SPECIAL_KEY',
    payload: { specialKeyName: keyName },
  };
  workerRef.current.postMessage(message);
}

/**
 * Handles keypress events during a session, sending appropriate messages to the session recorder worker to process key presses, switch timers, or end the session based on user input and the current running state of the session.
 *
 * @param ev - The keyboard event triggered by the user's keypress, which will be processed to determine the appropriate action to take (e.g., processing a key, switching timers, or ending the session).
 * @param param1 - An object containing various state management functions, refs, and data needed to process the keypress logic appropriately based on the current session state and user settings.
 * @returns void
 */
export function SessionProcessKeypress(
  ev: React.KeyboardEvent<HTMLElement>,
  {
    ApplicationSettings,
    Keyset,
    runningState,
    workerRef,
    endingProcessedRef,
    wakelockRef,
    setStartTime,
    keysPressed,
  }: {
    ApplicationSettings: ApplicationSettingsTypes;
    Keyset: KeySet;
    runningState: RunningStateOptions;
    workerRef: MutableRefObject<Worker | null>;
    endingProcessedRef: MutableRefObject<boolean>;
    wakelockRef: MutableRefObject<WakeLockSentinel | undefined>;

    setStartTime: Dispatch<SetStateAction<Date | null>>;
    keysPressed: KeyManageType[];
  },
) {
  if (ev.repeat) return;

  if (ev.key === 'Space' || ev.key === ' ') ev.preventDefault();

  if (runningState === 'Not Started') {
    if (ev.key === 'Escape') history.go(-1);

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
    switchTimer('Primary', workerRef);
    return;
  }

  if (ev.key === 'x' && ApplicationSettings.TimerTwoDisplay === 'show') {
    // Allow switch to Secondary from any current state
    switchTimer('Secondary', workerRef);
    return;
  }

  if (ev.key === 'c' && ApplicationSettings.TimerThreeDisplay === 'show') {
    // Allow switch to Tertiary from any current state
    switchTimer('Tertiary', workerRef);
    return;
  }

  // Handle special duration key switches (using actual key names)
  if (runningState === 'Started') {
    const specialKeys = Keyset.SpecialDurationKeys;
    const matchingSpecialKey = specialKeys.find((key) => key.KeyName.toLowerCase() === ev.key.toLowerCase());

    if (matchingSpecialKey) {
      // Switch to special key timer
      switchToSpecialKey(matchingSpecialKey.KeyName, workerRef);
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
}
