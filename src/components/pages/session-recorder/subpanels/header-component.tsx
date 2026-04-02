import { cn } from '@/lib/utils';
import { SavedSettings } from '@/lib/dtos/session-settings';
import { KeySet } from '@/types/keyset';
import { RunningStateOptions } from '@/types/session';

const DataCollectorVisual = ({ Settings }: { Settings: SavedSettings }) => {
  return (
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
  );
};

const TimerDisplayVisual = ({ Settings, TimerString }: { Settings: SavedSettings; TimerString: string }) => {
  return (
    <p
      className={cn(
        'mx-2 transition-colors bg-transparent rounded-full px-2 text-sm flex items-center w-fit whitespace-nowrap bg-blue-500 text-white',
        {
          'bg-gray-600 text-white': Settings.TimerOption === 'End on Primary Timer',
          'bg-green-400 text-white': Settings.TimerOption === 'End on Timer #1',
          'bg-orange-400 text-white': Settings.TimerOption === 'End on Timer #2',
          'bg-red-400 text-white': Settings.TimerOption === 'End on Timer #3',
        },
      )}
    >
      {TimerString}
    </p>
  );
};

const SessionRunState = ({ RunningState }: { RunningState: RunningStateOptions }) => {
  return (
    <div className="flex-1 flex flex-row justify-end whitespace-nowrap">
      <p
        className={cn('transition-colors bg-transparent rounded-full px-2 text-sm flex items-center w-fit', {
          'bg-gray-600 text-white': RunningState === 'Not Started',
          'bg-blue-400 text-white': RunningState === 'Started',
          'bg-green-400 text-white': RunningState === 'Completed',
        })}
      >
        {RunningState}
      </p>
    </div>
  );
};

function buildTimerString(Settings: SavedSettings, KeySet: KeySet): string {
  switch (Settings.TimerOption) {
    case 'End on Primary Timer':
      return `Primary Timer (${Settings.DurationS}s)`;
    case 'End on Timer #1':
      return `Timer #1 (${Settings.DurationS}s)`;
    case 'End on Timer #2':
      return `Timer #2 (${Settings.DurationS}s)`;
    case 'End on Timer #3':
      return `Timer #3 (${Settings.DurationS}s)`;
    default: {
      const matchingSpecialKey = KeySet.SpecialDurationKeys.find((key) => key.KeyCode === Settings.TimerOption);
      return matchingSpecialKey ? `${matchingSpecialKey.KeyDescription} (${Settings.DurationS}s)` : 'No Timer Selected';
    }
  }
}

export default function SessionHeaderComponent({
  Settings,
  RunningState,
  KeySet,
}: {
  Settings: SavedSettings;
  RunningState: RunningStateOptions;
  KeySet: KeySet;
}) {
  const timerDisplayMessage = buildTimerString(Settings, KeySet);

  return (
    <div className="w-full flex flex-row justify-between select-none">
      <div className="flex-1 flex flex-row">
        <DataCollectorVisual Settings={Settings} />
        <TimerDisplayVisual Settings={Settings} TimerString={timerDisplayMessage} />
      </div>
      <div className="flex-1 flex flex-row justify-center items-center text-center font-bold whitespace-nowrap">
        <p className="flex-1">{`Session #${Settings.Session}`}</p>
      </div>
      <div className="flex-1 flex flex-row justify-end whitespace-nowrap">
        <SessionRunState RunningState={RunningState} />
      </div>
    </div>
  );
}
