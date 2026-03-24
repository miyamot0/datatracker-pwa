import { KeyManageType, TimerSetting } from '@/types/timing';
import { SavedSettings } from '@/lib/dtos';
import { KeySet } from '@/types/keyset';
import { SessionRecorderPolling } from '@/types/settings';

/**
 * Typing for worker messaging (Main --> Worker)
 */
export interface WorkerMessage {
  type:
    | 'INIT'
    | 'START_SESSION'
    | 'STOP_SESSION'
    | 'SWITCH_TIMER'
    | 'SWITCH_SPECIAL_KEY'
    | 'PROCESS_KEY'
    | 'DELETE_LAST_KEY'
    | 'SETUP_CHANNEL';
  payload?: {
    settings?: SavedSettings;
    keyset?: KeySet;
    uiPollingInterval?: SessionRecorderPolling;
    reason?: 'Completed' | 'Cancelled';
    timer?: 'Primary' | 'Secondary' | 'Tertiary';
    specialKeyName?: string;
    keyName?: string;
    keyCode?: number;
  };
  ports?: MessagePort[];
}

/**
 * Typing for worker messaging (Worker --> Main)
 */
export interface WorkerResponse {
  type: 'TIMER_UPDATE' | 'KEY_PROCESSED' | 'SESSION_ENDED' | 'SYSTEM_EVENT' | 'KEY_DELETED' | 'HIGH_FREQ_UPDATE';
  payload?: {
    // Timer update payload
    total?: number;
    first?: number;
    second?: number;
    third?: number;
    active?: number;
    activeTimer?: TimerSetting;
    specialKeyTimers?: Record<string, number>;
    activeSpecialKey?: string | null;

    // Key processed payload
    key?: KeyManageType;
    totalKeys?: number;

    // Key deleted payload
    deletedKey?: KeyManageType;

    // System event payload
    events?: KeyManageType[];
    isRunning?: boolean;

    // Session ended payload
    reason?: 'Completed' | 'Cancelled';
    keysPressed?: KeyManageType[];
    systemKeysPressed?: KeyManageType[];
    timers?: {
      total: number;
      first: number;
      second: number;
      third: number;
    };
    startTime?: string | null;
  };
  timestamp?: number;
}
