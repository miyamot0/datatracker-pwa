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

/**
 * Extended timer type that supports both standard timers and special duration keys
 */
export type ActiveTimerType = TimerSetting | { type: 'Special'; keyName: string };
