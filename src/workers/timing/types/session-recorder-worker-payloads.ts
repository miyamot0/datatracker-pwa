import { KeyManageType, TimerSetting } from "@/types/timing";


export type TimerUpdatePayload = {
  total: number;
  first: number;
  second: number;
  third: number;
  active: number;
  activeTimer: TimerSetting;
};

export type KeyProcessedPayload = {
  key: KeyManageType;
  totalKeys: number;
};

export type SystemEventPayload = {
  events?: KeyManageType[];
  activeTimer?: TimerSetting;
  isRunning?: boolean;
};

export type SessionEndedPayload = {
  reason: 'Completed' | 'Cancelled';
  keysPressed: KeyManageType[];
  systemKeysPressed: KeyManageType[];
  timers: {
    total: number;
    first: number;
    second: number;
    third: number;
  };
  startTime: string | null;
};
