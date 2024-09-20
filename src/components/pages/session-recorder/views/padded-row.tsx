import { cn } from '@/lib/utils';
import { TimerSetting } from '../types/session-recorder-types';
import { formatTimeSeconds } from '@/lib/time';

export const PaddedRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-row mx-4 text-sm">
    <p className="w-[250px] font-semibold">{label}</p>
    <p className="flex-1">{value}</p>
  </div>
);

export const PaddedTimerRow = ({
  ActiveTimer,
  AssignedTimer,
  SecondsElapsed,
  Running,
}: {
  ActiveTimer: TimerSetting;
  AssignedTimer: TimerSetting | undefined;
  SecondsElapsed: number;
  Running: boolean;
}) => {
  let label = 'Total Time:';

  if (AssignedTimer === 'Primary') {
    label = 'Schedule 1 Time:';
  } else if (AssignedTimer === 'Secondary') {
    label = 'Schedule 2 Time:';
  } else if (AssignedTimer === 'Tertiary') {
    label = 'Schedule 3 Time:';
  }

  return (
    <div className="flex flex-row mx-2 text-sm mb-2">
      <p className={cn('w-[250px] transition-colors bg-transparent font-semibold')}>{label}</p>
      <p
        className={cn('px-2 transition-colors bg-transparent rounded-full', {
          'bg-gray-500 text-white': Running && AssignedTimer === undefined,
          'bg-green-500 text-white': ActiveTimer === 'Primary' && Running && AssignedTimer === 'Primary',
          'bg-orange-500 text-white': ActiveTimer === 'Secondary' && Running && AssignedTimer === 'Secondary',
          'bg-red-500 text-white': ActiveTimer === 'Tertiary' && Running && AssignedTimer === 'Tertiary',
        })}
      >
        {formatTimeSeconds(SecondsElapsed)}
      </p>
    </div>
  );
};
