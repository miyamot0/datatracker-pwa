import { Table, TableHeader, TableRow, TableHead, TableBody } from '@/components/ui/table';
import { formatTimeOfDay } from '@/lib/time';
import { KeyManageType, TimerSetting } from '../types/session-recorder-types';
import { PaddedTimerRow } from './padded-row';

type Props = {
  KeysPressed: KeyManageType[];
  SecondsElapsed: number;
  SecondsElapsedFirst: number;
  SecondsElapsedSecond: number;
  SecondsElapsedThird: number;
  SecondsElapsedDelta: number;
  ActiveTimer: TimerSetting;
  Running: boolean;
};

export default function KeyHistoryListing({
  KeysPressed,
  SecondsElapsed,
  SecondsElapsedFirst,
  SecondsElapsedSecond,
  SecondsElapsedThird,
  SecondsElapsedDelta,
  ActiveTimer,
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
