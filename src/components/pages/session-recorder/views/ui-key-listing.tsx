import { PaddedTimerRow } from './padded-row';
import { TimerSetting } from '@/types/timing';
import { KeySetInstance } from '@/types/keyset';
import { cn } from '@/lib/utils';
import { formatTimeSeconds } from '@/lib/time';
import { ApplicationSettingsTypes } from '@/types/settings';

type Props = {
  KeySetSpecialKeys: KeySetInstance[];
  SpecialKeyTimers: Record<string, number>;
  SecondsElapsed: number;
  SecondsElapsedFirst: number;
  SecondsElapsedSecond: number;
  SecondsElapsedThird: number;
  SecondsElapsedDelta: number;
  ActiveTimer: TimerSetting;
  ActiveSpecialTimer: string | null;
  Running: boolean;
  AppSettings: ApplicationSettingsTypes;
};

export default function KeyHistoryListing({
  KeySetSpecialKeys,
  SpecialKeyTimers,
  SecondsElapsed,
  SecondsElapsedFirst,
  SecondsElapsedSecond,
  SecondsElapsedThird,
  SecondsElapsedDelta,
  ActiveTimer,
  ActiveSpecialTimer,
  Running,
  AppSettings,
}: Props) {
  return (
    <>
      <PaddedTimerRow
        AssignedTimer={undefined}
        ActiveTimer={ActiveTimer}
        SecondsElapsed={SecondsElapsed}
        SecondsDelta={SecondsElapsedDelta}
        Running={Running}
      />

      <PaddedTimerRow
        AssignedTimer="Primary"
        ActiveTimer={ActiveTimer}
        SecondsElapsed={SecondsElapsedFirst}
        SecondsDelta={SecondsElapsedDelta}
        Running={Running}
      />

      {AppSettings.TimerTwoDisplay === 'show' && (
        <PaddedTimerRow
          AssignedTimer="Secondary"
          ActiveTimer={ActiveTimer}
          SecondsElapsed={SecondsElapsedSecond}
          SecondsDelta={SecondsElapsedDelta}
          Running={Running}
        />
      )}

      {AppSettings.TimerThreeDisplay === 'show' && (
        <PaddedTimerRow
          AssignedTimer="Tertiary"
          ActiveTimer={ActiveTimer}
          SecondsElapsed={SecondsElapsedThird}
          SecondsDelta={SecondsElapsedDelta}
          Running={Running}
        />
      )}

      {KeySetSpecialKeys.map((key, index) => {
        return (
          <div key={index} className="flex flex-row mx-2 text-sm mb-2">
            <p className={cn('w-[250px] transition-colors bg-transparent font-semibold')}>{key.KeyDescription}</p>
            <p
              className={cn('px-2 transition-colors bg-transparent rounded-full', {
                'bg-blue-500 text-white': ActiveSpecialTimer === key.KeyName && Running,
              })}
            >
              {formatTimeSeconds(SpecialKeyTimers[key.KeyName] || 0)}
            </p>
          </div>
        );
      })}
    </>
  );
}
