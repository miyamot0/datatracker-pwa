import { KeyManageType, TimerSetting } from "@/types/timing";


export type TimerUpdatePayload = {
  total: number;
  first: number;
  second: number;
  third: number;
  active: number;
  activeTimer: TimerSetting;
  // Special duration key timers
  specialKeyTimers: Record<string, number>;
  activeSpecialKey: string | null;
};

export type KeyProcessedPayload = {
  key: KeyManageType;
  totalKeys: number;
};

export type SystemEventPayload = {
  events?: KeyManageType[];
  activeTimer?: TimerSetting;
  activeSpecialKey?: string | null;
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
  specialKeyTimers: Record<string, number>;
  startTime: string | null;
};
