'use client';

import PageWrapper from '@/components/layout/page-wrapper';
import { useEventListener } from '@/helpers/event-listeners';
import { SavedSettings } from '@/lib/dtos';
import { cn } from '@/lib/utils';
import { KeySet } from '@/types/keyset';
import { useState, useRef, useEffect, useContext } from 'react';
import { KeyManageType, KeyTiming, TimerSetting } from './types/session-recorder-types';
import {
  GetHandleEvaluationFolder,
  GetHandleKeyboardsFolder,
  GetSettingsFileFromEvaluationFolder,
  pullSessionSettings,
  saveSessionOutcomesToFile,
  saveSessionSettingsToFile,
} from '@/lib/files';
import { CleanUpString } from '@/lib/strings';
import { toast } from 'sonner';
import SessionRecorderInstructions from './views/ui-instructions';
import KeyHistoryListing from './views/ui-key-listing';
import SessionRecorderTallies from './views/ui-counts';
import createHref from '@/lib/links';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildSessionDesignerBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { displayConditionalNotification } from '@/lib/notifications';
import { FolderHandleContext } from '@/context/folder-context';
import { useNavigate, useParams } from 'react-router-dom';
import { deserializeKeySet } from '@/lib/keyset';

const PullKeySet = async (Handle: FileSystemDirectoryHandle, Group: string, Individual: string, KeySet: string) => {
  const keyboard_folder = await GetHandleKeyboardsFolder(Handle, Group, Individual);

  return keyboard_folder.getFileHandle(KeySet, { create: true });
};

export function SessionRecorderPageShim() {
  const { handle } = useContext(FolderHandleContext);
  const [settings, setSettings] = useState<SavedSettings | undefined>();
  const [keySet, setKeySet] = useState<KeySet>();
  const navigate = useNavigate();

  const { Group, Individual, Evaluation } = useParams();

  useEffect(() => {
    if (!handle || !Group || !Individual || !Evaluation) {
      navigate(createHref({ type: 'Dashboard' }));
      return;
    }

    const runner = async () => {
      const files = await GetHandleEvaluationFolder(
        handle,
        CleanUpString(Group),
        CleanUpString(Individual),
        CleanUpString(Evaluation)
      );

      if (!files) throw new Error('No files found for this evaluation');

      const settings = await GetSettingsFileFromEvaluationFolder(files);

      setSettings(settings);

      PullKeySet(handle, Group, Individual, `${settings.KeySet}.json`).then(async (entry) => {
        const keyset = await entry.getFile();
        const keyset_text = await keyset.text();

        if (keyset_text.length === 0) return;

        const keyset_json = deserializeKeySet(keyset_text);

        if (keyset_json) {
          setKeySet(keyset_json);
        }
      });
    };

    runner();

    return function cleanup() {};
  }, [Evaluation, Group, Individual, handle, navigate]);

  if (!handle || !settings || !keySet) return null;

  return (
    <SessionRecorderPage
      Handle={handle}
      Group={CleanUpString(Group!)}
      Individual={CleanUpString(Individual!)}
      Evaluation={CleanUpString(Evaluation!)}
      Settings={settings}
      Keyset={keySet}
    />
  );
}

type Props = {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
  Evaluation: string;
  Keyset: KeySet;
  Settings: SavedSettings;
};

const TIME_DELTA = 50;
const TIME_UNIT = 1000;

export default function SessionRecorderPage({ Handle, Group, Individual, Evaluation, Keyset, Settings }: Props) {
  const navigate = useNavigate();
  const { settings: applicationSettings } = useContext(FolderHandleContext);

  const [keysPressed, setKeysPressed] = useState<KeyManageType[]>([]);
  const [systemKeysPressed, setSystemKeysPressed] = useState<KeyManageType[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setTickCount] = useState<number>(0);

  const secondsElapsedTotal = useRef<number>(0);
  const secondsElapsedFirst = useRef<number>(0);
  const secondsElapsedSecond = useRef<number>(0);
  const secondsElapsedThird = useRef<number>(0);

  const [runningState, setRunningState] = useState<'Not Started' | 'Started' | 'Completed' | 'Cancelled'>(
    'Not Started'
  );

  const [startTime, setStartTime] = useState<Date | null>(null);

  const totalTimerRef = useRef<NodeJS.Timeout>();
  const activeTimerRef = useRef<TimerSetting>('Stopped');

  useEffect(() => {
    if (!Handle) {
      navigate(createHref({ type: 'Dashboard' }));
      return;
    }

    if (runningState === 'Completed' || runningState === 'Cancelled') {
      const save_output = async () => {
        if (!startTime) throw new Error('No start time found.');

        const ended_early = runningState === 'Cancelled';

        const final_system_keys = [
          ...systemKeysPressed,
          {
            KeyName: 'Escape',
            KeyCode: 0,
            KeyDescription: 'End of Session',
            TimePressed: new Date(),
            KeyScheduleRecording: activeTimerRef.current as KeyTiming,
            KeyType: 'System',
            TimeIntoSession: 0,
          } satisfies KeyManageType,
        ];

        if (ended_early) {
          const confirm_save = window.confirm(
            'This data will be saved even though the session ended early. Are you sure?'
          );

          if (confirm_save === false) {
            navigate(`/session/${CleanUpString(Group)}/${CleanUpString(Individual)}/${CleanUpString(Evaluation)}`);
            return;
          }
        }

        await saveSessionOutcomesToFile(
          Handle,
          Settings,
          keysPressed,
          final_system_keys,
          Keyset,
          Group,
          Individual,
          Evaluation,
          startTime,
          Math.min(secondsElapsedTotal.current, Settings.DurationS),
          Math.min(secondsElapsedFirst.current, Settings.DurationS),
          Math.min(secondsElapsedSecond.current, Settings.DurationS),
          Math.min(secondsElapsedThird.current, Settings.DurationS),
          ended_early
        );

        const settings = await pullSessionSettings(Handle, Group, Individual, Evaluation);

        try {
          await saveSessionSettingsToFile(Handle, Group, Individual, Evaluation, settings);

          switch (applicationSettings.PostSessionBx) {
            case 'AutoAdvance':
              navigate(`/session/${CleanUpString(Group)}/${CleanUpString(Individual)}/${CleanUpString(Evaluation)}`);

              break;

            case 'AwaitInput':
              toast('Session has been recorded.', {
                description: 'Click button to queue session.',
                action: {
                  label: 'Load Next Session',
                  onClick: () => {
                    navigate(
                      `/session/${CleanUpString(Group)}/${CleanUpString(Individual)}/${CleanUpString(Evaluation)}`
                    );
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
            true
          );
        }
      };

      save_output();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    () => {
      clearInterval(totalTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningState, keysPressed, Settings, Handle, navigate, Group, Individual, Evaluation, applicationSettings]);

  function registerListener(timer: 'Primary' | 'Secondary' | 'Tertiary') {
    if (totalTimerRef.current) {
      setSystemKeysPressed([
        ...systemKeysPressed,
        {
          KeyName: activeTimerRef.current,
          KeyCode: 0,
          KeyDescription: `End of ${activeTimerRef.current}`,
          TimePressed: new Date(),
          KeyScheduleRecording: activeTimerRef.current as KeyTiming,
          KeyType: 'System',
          TimeIntoSession: 0,
        } satisfies KeyManageType,
      ]);

      activeTimerRef.current = timer;

      setSystemKeysPressed([
        ...systemKeysPressed,
        {
          KeyName: activeTimerRef.current,
          KeyCode: 0,
          KeyDescription: `Start of ${timer}`,
          TimePressed: new Date(),
          KeyScheduleRecording: activeTimerRef.current as KeyTiming,
          KeyType: 'System',
          TimeIntoSession: 0,
        } satisfies KeyManageType,
      ]);

      return;
    }

    totalTimerRef.current = setInterval(() => {
      secondsElapsedTotal.current += TIME_DELTA / TIME_UNIT;

      switch (activeTimerRef.current) {
        case 'Primary':
          secondsElapsedFirst.current += TIME_DELTA / TIME_UNIT;

          break;
        case 'Secondary':
          secondsElapsedSecond.current += TIME_DELTA / TIME_UNIT;

          break;
        case 'Tertiary':
          secondsElapsedThird.current += TIME_DELTA / TIME_UNIT;

          break;
      }

      setTickCount((prev) => prev + 1);

      if (Settings.TimerOption === 'End on Primary Timer' && secondsElapsedTotal.current >= Settings.DurationS) {
        clearInterval(totalTimerRef.current);
        setRunningState('Completed');

        return;
      } else if (Settings.TimerOption === 'End on Timer #1' && secondsElapsedFirst.current >= Settings.DurationS) {
        clearInterval(totalTimerRef.current);
        setRunningState('Completed');

        return;
      } else if (Settings.TimerOption === 'End on Timer #2' && secondsElapsedSecond.current >= Settings.DurationS) {
        clearInterval(totalTimerRef.current);
        setRunningState('Completed');

        return;
      } else if (Settings.TimerOption === 'End on Timer #3' && secondsElapsedThird.current >= Settings.DurationS) {
        clearInterval(totalTimerRef.current);
        setRunningState('Completed');

        return;
      }
    }, TIME_DELTA);
  }

  // Note: Z/X/C for Timers 1/2/3
  useEventListener('keydown', (ev: React.KeyboardEvent<HTMLElement>) => {
    if (ev.repeat) {
      return;
    }

    if (!totalTimerRef.current) {
      if (ev.key === 'Enter' && runningState === 'Not Started') {
        //setActiveTimer("Primary");
        activeTimerRef.current = 'Primary';
        registerListener('Primary');

        setRunningState('Started');
        setStartTime(new Date());

        setSystemKeysPressed([
          ...systemKeysPressed,
          {
            KeyName: ev.key,
            KeyCode: ev.keyCode,
            KeyDescription: 'Start of Session',
            TimePressed: new Date(),
            KeyScheduleRecording: activeTimerRef.current as KeyTiming,
            KeyType: 'System',
            TimeIntoSession: 0,
          } satisfies KeyManageType,
        ]);

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
      registerListener('Primary');
      return;
    }

    if (ev.key === 'x' && activeTimerRef.current !== 'Secondary') {
      registerListener('Secondary');
      return;
    }

    if (ev.key === 'c' && activeTimerRef.current !== 'Tertiary') {
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

  if (!Handle) return null;

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
        BuildSessionDesignerBreadcrumb(Group, Individual, Evaluation),
      ]}
      label={`Record ${Evaluation} Session`}
    >
      <div className="flex flex-col w-full gap-4 max-w-screen-2xl">
        <div className="w-full flex flex-row justify-between">
          <div className="flex-1 flex flex-row">
            <p
              className={cn('transition-colors bg-transparent rounded-full px-2 text-sm flex items-center w-fit', {
                'bg-green-600 text-white': Settings.Role === 'Primary',
                'bg-purple-400 text-white': Settings.Role === 'Reliability',
              })}
            >
              {`${Settings.Role} Data Collector`}
            </p>
            <p
              className={cn('mx-2 transition-colors bg-transparent rounded-full px-2 text-sm flex items-center w-fit', {
                'bg-gray-600 text-white': Settings.TimerOption === 'End on Primary Timer',
                'bg-green-400 text-white': Settings.TimerOption === 'End on Timer #1',
                'bg-orange-400 text-white': Settings.TimerOption === 'End on Timer #2',
                'bg-red-400 text-white': Settings.TimerOption === 'End on Timer #3',
              })}
            >
              {Settings.TimerOption} ({Settings.DurationS}s)
            </p>
          </div>
          <div className="flex-1 flex flex-row justify-center items-center text-center font-bold">
            <p className="flex-1">{`Session #${Settings.Session}`}</p>
          </div>
          <div className="flex-1 flex flex-row justify-end">
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

        <SessionRecorderTallies KeysPressed={keysPressed} Keyset={Keyset} />
        <div className="grid grid-cols-2 w-full gap-4 ">
          <SessionRecorderInstructions {...{ Evaluation, Settings }} />
          <KeyHistoryListing
            KeysPressed={keysPressed}
            SecondsElapsed={Math.min(secondsElapsedTotal.current, Settings.DurationS)}
            SecondsElapsedFirst={Math.min(secondsElapsedFirst.current, Settings.DurationS)}
            SecondsElapsedSecond={Math.min(secondsElapsedSecond.current, Settings.DurationS)}
            SecondsElapsedThird={Math.min(secondsElapsedThird.current, Settings.DurationS)}
            ActiveTimer={activeTimerRef.current}
            Running={!!totalTimerRef.current}
          />
        </div>
      </div>
    </PageWrapper>
  );
}
