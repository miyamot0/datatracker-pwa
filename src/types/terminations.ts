// Session termination options
export const SessionTerminationOptions = {
  TimerMain: 'End on Primary Timer',
  Timer1: 'End on Timer #1',
  Timer2: 'End on Timer #2',
  //Timer12: 'End on Timer #1 and #2 Total',
  Timer3: 'End on Timer #3',
} as const;

export const SessionTerminationOptionsDescriptions = [
  {
    value: SessionTerminationOptions.TimerMain,
    description: 'End on TOTAL Session Time (Independent of Active Timer)',
  },
  {
    value: SessionTerminationOptions.Timer1,
    description: 'End on Timer #1 Time Specifically (When Timer #1 > Duration)',
  },
  {
    value: SessionTerminationOptions.Timer2,
    description: 'End on Timer #2 Time Specifically (When Timer #2 > Duration)',
  },
  //{
  //  value: SessionTerminationOptions.Timer12,
  //  description: 'End on Combined Duration of Timer #1/#2 (When Timer #1 + Timer #2 > Duration)',
  //},
  {
    value: SessionTerminationOptions.Timer3,
    description: 'End on Timer #3 Time Specifically (When Timer #3 > Duration)',
  },
];

// Type for session termination options
export type SessionTerminationOptionsType = (typeof SessionTerminationOptions)[keyof typeof SessionTerminationOptions];
