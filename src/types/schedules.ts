import { SessionTerminationOptions } from '@/forms/schema/session-designer-schema';

export const ScheduleMappingOptions = [
  {
    value: SessionTerminationOptions.TimerMain,
    label: 'Score Total Time',
  },
  {
    value: SessionTerminationOptions.Timer1,
    label: 'Score Timer #1 Time',
  },
  {
    value: SessionTerminationOptions.Timer2,
    label: 'Score Timer #2 Time',
  },
  {
    value: SessionTerminationOptions.Timer3,
    label: 'Score Timer #3 Time',
  },
];

export type ScheduleMappingOptionsType = (typeof ScheduleMappingOptions)[number];
