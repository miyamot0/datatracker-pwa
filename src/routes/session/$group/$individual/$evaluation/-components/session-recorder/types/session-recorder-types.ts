export type KeyTiming = 'Primary' | 'Secondary' | 'Tertiary';

export type KeyManageType = {
  KeyName: string;
  KeyCode: number;
  KeyDescription: string;
  KeyScheduleRecording: KeyTiming;
  TimePressed: Date;
  TimeIntoSession: number;
  KeyType: 'Frequency' | 'Duration' | 'System' | 'Timing';
  ScheduleIndicator?: 'Start' | 'End';
};

export type TimerSetting = 'Primary' | 'Secondary' | 'Tertiary' | 'Stopped';
