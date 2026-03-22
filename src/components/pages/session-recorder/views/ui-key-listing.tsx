import { Table, TableHeader, TableRow, TableHead, TableBody } from '@/components/ui/table';
import { formatTimeOfDay } from '@/lib/time';
import { PaddedTimerRow } from './padded-row';
import { KeyManageType, TimerSetting } from '@/types/timing';
import { KeySetInstance } from '@/types/keyset';
import { cn } from '@/lib/utils';
import { formatTimeSeconds } from '@/lib/time';

type Props = {
  KeySetSpecialKeys: KeySetInstance[];
  SpecialKeyTimers: Record<string, number>;
  KeysPressed: KeyManageType[];
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
  KeysPressed,
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
    <div className="w-full flex flex-col gap-0 border rounded shadow-xl bg-card">
      <div className="w-full text-center my-2 text-sm font-bold">Session Measurements</div>

      <hr className="mb-2" />

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

      <hr />
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
          {KeysPressed.slice(-5)
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
    </div>
  );
}
