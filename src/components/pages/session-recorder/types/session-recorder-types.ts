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

/*
type SessionRecordingState = {
  FrequencyKeys: {
    KeyName: string;
    KeyDescription: string;
    KeyCode: number;
    Count: number;
  }[];
  DurationKeys: {
    KeyName: string;
    KeyDescription: string;
    KeyCode: number;
    Rounds: number;
    Duration: number;
  }[];
};

export const DEFAULT_SESSION_RECORDING_STATE: SessionRecordingState = {
  FrequencyKeys: [],
  DurationKeys: [],
};
*/
