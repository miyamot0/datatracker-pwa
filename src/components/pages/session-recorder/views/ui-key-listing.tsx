import { PaddedTimerRow } from './padded-row';
import { TimerSetting } from '@/types/timing';
import { KeySetInstance } from '@/types/keyset';
import { cn } from '@/lib/utils';
import { formatTimeSeconds } from '@/lib/time';

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

      <PaddedTimerRow
        AssignedTimer="Secondary"
        ActiveTimer={ActiveTimer}
        SecondsElapsed={SecondsElapsedSecond}
        SecondsDelta={SecondsElapsedDelta}
        Running={Running}
      />

      <PaddedTimerRow
        AssignedTimer="Tertiary"
        ActiveTimer={ActiveTimer}
        SecondsElapsed={SecondsElapsedThird}
        SecondsDelta={SecondsElapsedDelta}
        Running={Running}
      />

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
