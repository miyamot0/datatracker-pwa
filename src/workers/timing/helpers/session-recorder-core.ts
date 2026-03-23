import { KeySet } from '@/types/keyset';
import { SavedSettings } from '@/lib/dtos';
import { KeyManageType, KeyTiming, TimerSetting } from '@/types/timing';
import { SessionPollingIntervals, SessionRecorderPolling } from '@/types/settings';

const TIME_DELTA = 10; /** Polling interval in milliseconds */
const TIME_UNIT = 1000; /** Number of milliseconds in one second */
const INCREMENT = TIME_DELTA / TIME_UNIT; /** Increment value for timers, i.e., 20 hz */

/**
 * Utility functions for time handling
 */
export const getHighResTime = (): number => {
  return performance.now();
};

export const formatTimestamp = (perfTime: number): string => {
  // Convert performance.now() time to ISO string equivalent
  return new Date(Date.now() - (performance.now() - perfTime)).toJSON();
};

/**
 * Session state interface for better type safety
 */
export interface SessionState {
  secondsElapsedTotal: number;
  secondsElapsedFirst: number;
  secondsElapsedSecond: number;
  secondsElapsedThird: number;
  secondsElapsedActive: number;
  activeTimer: TimerSetting;
  startTime: number | null;
  isRunning: boolean;
  // Special duration key timer tracking
  specialKeyTimers: Map<string, number>;
  activeSpecialKey: string | null;
}

/**
 * Timer update payload interface
 */
export interface TimerUpdatePayload {
  total: number;
  first: number;
  second: number;
  third: number;
  active: number;
  activeTimer: TimerSetting;
  specialKeyTimers: Record<string, number>;
  activeSpecialKey: string | null;
}

/**
 * Session end result interface
 */
export interface SessionEndResult {
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
}

/**
 * Core session recording logic separated from web worker implementation
 */
export class SessionRecorderCore {
  private settings: SavedSettings | null = null;
  private keyset: KeySet | null = null;
  private keysPressed: KeyManageType[] = [];
  private systemKeysPressed: KeyManageType[] = [];
  private state: SessionState;
  private uiUpdateInterval: number = 100;

  constructor() {
    this.state = this.createInitialState();
  }

  /**
   * Creates the initial state for the session recorder
   */
  private createInitialState(): SessionState {
    return {
      secondsElapsedTotal: 0,
      secondsElapsedFirst: 0,
      secondsElapsedSecond: 0,
      secondsElapsedThird: 0,
      secondsElapsedActive: 0,
      activeTimer: 'Stopped',
      startTime: null,
      isRunning: false,
      specialKeyTimers: new Map(),
      activeSpecialKey: null,
    };
  }

  /**
   * Initializes the session recorder with settings and keyset
   */
  init(settings: SavedSettings, keyset: KeySet, uiPollingInterval: SessionRecorderPolling): void {
    this.settings = settings;
    this.keyset = keyset;
    this.uiUpdateInterval = SessionPollingIntervals[uiPollingInterval];
    this.resetState();

    // Initialize special key timers
    if (this.keyset?.SpecialDurationKeys) {
      this.state.specialKeyTimers.clear();
      this.keyset.SpecialDurationKeys.forEach((key) => {
        this.state.specialKeyTimers.set(key.KeyName, 0);
      });
    }
  }

  /**
   * Resets the state of the session recorder
   */
  resetState(): void {
    this.keysPressed = [];
    this.systemKeysPressed = [];
    this.state = this.createInitialState();
  }

  /**
   * Starts a new session
   */
  startSession(): { systemEvents: KeyManageType[]; startTime: number } | null {
    if (!this.settings || this.state.isRunning) return null;

    const sessionStartTimestamp = getHighResTime();
    this.state.startTime = sessionStartTimestamp;
    this.state.isRunning = true;
    this.state.activeTimer = 'Primary';
    this.state.secondsElapsedActive = 0;

    // Create initial system events
    const sessionStartEvent = this.createSystemEvent(
      'Enter',
      13,
      'Start of Session',
      this.state.activeTimer as KeyTiming,
      'Start',
      sessionStartTimestamp,
    );

    const primaryStartEvent = this.createSystemEvent('Primary', 0, 'Start of Primary', 'Primary' as KeyTiming, 'Start');

    const systemEvents = [sessionStartEvent, primaryStartEvent];
    this.systemKeysPressed.push(...systemEvents);

    return { systemEvents, startTime: sessionStartTimestamp };
  }

  /**
   * Updates timers and returns whether session should end
   */
  updateTimers(): { shouldEnd: boolean; timerUpdate?: TimerUpdatePayload } {
    if (!this.settings || !this.state.isRunning) {
      return { shouldEnd: false };
    }

    // Check if session should end after this update cycle
    const shouldEnd = this.checkSessionEnd();

    // Update timers - exclusive logic: only one timer type should be active at a time
    this.state.secondsElapsedTotal += INCREMENT;
    this.state.secondsElapsedActive += INCREMENT;

    // Increment timers exclusively based on what's currently active
    if (this.state.activeSpecialKey) {
      // Special key timer is active - ONLY increment the special key timer
      const currentValue = this.state.specialKeyTimers.get(this.state.activeSpecialKey) || 0;
      this.state.specialKeyTimers.set(this.state.activeSpecialKey, currentValue + INCREMENT);
    } else {
      // Standard timer is active - increment the appropriate standard timer
      switch (this.state.activeTimer) {
        case 'Primary':
          this.state.secondsElapsedFirst += INCREMENT;
          break;
        case 'Secondary':
          this.state.secondsElapsedSecond += INCREMENT;
          break;
        case 'Tertiary':
          this.state.secondsElapsedThird += INCREMENT;
          break;
      }
    }

    // Convert Map to Record for payload
    const specialKeyTimersRecord: Record<string, number> = {};
    this.state.specialKeyTimers.forEach((value, key) => {
      specialKeyTimersRecord[key] = value;
    });

    let timerUpdate: TimerUpdatePayload = {
      total: this.state.secondsElapsedTotal,
      first: this.state.secondsElapsedFirst,
      second: this.state.secondsElapsedSecond,
      third: this.state.secondsElapsedThird,
      active: this.state.secondsElapsedActive,
      activeTimer: this.state.activeTimer,
      specialKeyTimers: specialKeyTimersRecord,
      activeSpecialKey: this.state.activeSpecialKey,
    };

    if (shouldEnd) {
      if (this.settings.TimerOption === 'End on Total Time') {
        timerUpdate = {
          ...timerUpdate,
          total: Math.floor(this.state.secondsElapsedTotal),
        };
      } else if (this.settings.TimerOption === 'End on Timer #1') {
        timerUpdate = {
          ...timerUpdate,
          first: Math.floor(this.state.secondsElapsedFirst),
        };
      } else if (this.settings.TimerOption === 'End on Timer #2') {
        timerUpdate = {
          ...timerUpdate,
          second: Math.floor(this.state.secondsElapsedSecond),
        };
      } else if (this.settings.TimerOption === 'End on Timer #3') {
        timerUpdate = {
          ...timerUpdate,
          third: Math.floor(this.state.secondsElapsedThird),
        };
      } else if (typeof this.settings.TimerOption === 'number') {
        const specialKeyName = this.keyset?.SpecialDurationKeys.find(
          (key) => key.KeyCode === this.settings!.TimerOption,
        )?.KeyName;
        if (specialKeyName) {
          timerUpdate = {
            ...timerUpdate,
            specialKeyTimers: {
              ...timerUpdate.specialKeyTimers,
              [specialKeyName]: Math.floor(this.state.specialKeyTimers.get(specialKeyName) || 0),
            },
          };
        }
      }
    }

    return { shouldEnd, timerUpdate };
  }

  /**
   * Checks if the session should end after the next timer increment
   */
  private checkSessionEnd(): boolean {
    if (!this.settings) return false;

    // Primary timer always increments, so check it first
    if (this.settings.TimerOption === 'End on Primary Timer') {
      return this.state.secondsElapsedTotal > this.settings.DurationS;
    }

    // For standard timers, only check if the target timer is currently active
    if (this.settings.TimerOption === 'End on Timer #1' && this.state.activeTimer === 'Primary') {
      return this.state.secondsElapsedFirst > this.settings.DurationS;
    }

    if (this.settings.TimerOption === 'End on Timer #2' && this.state.activeTimer === 'Secondary') {
      return this.state.secondsElapsedSecond > this.settings.DurationS;
    }

    if (this.settings.TimerOption === 'End on Timer #3' && this.state.activeTimer === 'Tertiary') {
      return this.state.secondsElapsedThird > this.settings.DurationS;
    }

    // For special duration keys, check if the target key has reached duration
    if (this.keyset?.SpecialDurationKeys) {
      const specialKey = this.keyset.SpecialDurationKeys.find((key) => this.settings!.TimerOption === key.KeyCode);
      if (specialKey) {
        const specialKeyTime = this.state.specialKeyTimers.get(specialKey.KeyName) || 0;

        // If this special key is currently active, check with the increment
        if (this.state.activeSpecialKey === specialKey.KeyName) {
          const shouldEnd = specialKeyTime > this.settings.DurationS;
          return shouldEnd;
        }

        const shouldEnd = specialKeyTime > this.settings.DurationS;

        return shouldEnd;
      } else {
        console.log(`No matching special key found for TimerOption: ${this.settings.TimerOption}`);
      }
    }

    return false;
  }

  /**
   * Switches the active timer
   */
  switchTimer(timer: 'Primary' | 'Secondary' | 'Tertiary'): KeyManageType[] | null {
    if (!this.state.isRunning) return null;

    // Don't switch if we're already on the target standard timer AND no special key is active
    if (this.state.activeTimer === timer && !this.state.activeSpecialKey) {
      return null;
    }

    // Create end event for previous timer (standard or special)
    const endEvent = this.createEndEventForCurrentTimer();

    // Clear active special key if switching from special to standard timer
    if (this.state.activeSpecialKey) {
      this.state.activeSpecialKey = null;
    }

    // Switch to new timer
    this.state.activeTimer = timer;
    this.state.secondsElapsedActive = 0;

    // Create start event for new timer
    const startEvent = this.createSystemEvent(
      this.state.activeTimer,
      0,
      `Start of ${timer}`,
      timer as KeyTiming,
      'Start',
    );

    const systemEvents = [endEvent, startEvent];
    this.systemKeysPressed.push(...systemEvents);

    return systemEvents;
  }

  /**
   * Switches to a special duration key timer
   */
  switchToSpecialKey(keyName: string): KeyManageType[] | null {
    if (!this.state.isRunning || !this.state.specialKeyTimers.has(keyName) || this.state.activeSpecialKey === keyName) {
      return null;
    }

    // Create end event for previous timer (standard or special)
    const endEvent = this.createEndEventForCurrentTimer();

    // Clear standard timer and switch to special key
    this.state.activeTimer = 'Special';
    this.state.activeSpecialKey = keyName;
    this.state.secondsElapsedActive = this.state.specialKeyTimers.get(keyName) || 0;

    // Create start event for special key
    const startEvent = this.createSystemEvent(
      keyName,
      0,
      `Start of ${keyName}`,
      'Special' as KeyTiming, // Special keys use Special timing
      'Start',
    );

    const systemEvents = [endEvent, startEvent];
    this.systemKeysPressed.push(...systemEvents);

    return systemEvents;
  }

  /**
   * Creates an end event for the currently active timer
   */
  private createEndEventForCurrentTimer(): KeyManageType {
    if (this.state.activeSpecialKey) {
      // Currently on a special key
      return this.createSystemEvent(
        this.state.activeSpecialKey,
        0,
        `End of ${this.state.activeSpecialKey}`,
        'Special' as KeyTiming,
        'End',
      );
    } else {
      // Currently on a standard timer
      return this.createSystemEvent(
        this.state.activeTimer,
        0,
        `End of ${this.state.activeTimer}`,
        this.state.activeTimer as KeyTiming,
        'End',
      );
    }
  }

  /**
   * Processes a key press
   */
  processKey(_keyName: string, keyCode: number): { key: KeyManageType; totalKeys: number } | null {
    if (!this.state.isRunning || !this.keyset) return null;

    const isFreq = this.keyset.FrequencyKeys.some((key) => key.KeyCode === keyCode);
    const isDur = this.keyset.DurationKeys.some((key) => key.KeyCode === keyCode);

    if (!isFreq && !isDur) return null;

    let keyEvent: KeyManageType | null = null;
    const keyTimestamp = getHighResTime();

    // Create entry if relevant Frequency key found
    if (isFreq) {
      const freqKey = this.keyset.FrequencyKeys.find((key) => key.KeyCode === keyCode);
      if (!freqKey) return null;

      keyEvent = this.createKeyEvent(
        freqKey.KeyName,
        freqKey.KeyCode,
        freqKey.KeyDescription,
        'Frequency',
        keyTimestamp,
      );
    }

    // Create entry if relevant Duration key found
    if (isDur) {
      const durKey = this.keyset.DurationKeys.find((key) => key.KeyCode === keyCode);
      if (!durKey) return null;

      keyEvent = this.createKeyEvent(durKey.KeyName, durKey.KeyCode, durKey.KeyDescription, 'Duration', keyTimestamp);
    }

    if (keyEvent) {
      this.keysPressed.push(keyEvent);
      return {
        key: keyEvent,
        totalKeys: this.keysPressed.length,
      };
    }

    return null;
  }

  /**
   * Deletes the last recorded key
   */
  deleteLastKey(): { deletedKey: KeyManageType; totalKeys: number } | null {
    if (this.keysPressed.length === 0) return null;

    const deletedKey = this.keysPressed.pop();
    if (!deletedKey) return null;

    return {
      deletedKey,
      totalKeys: this.keysPressed.length,
    };
  }

  /**
   * Ends the session
   */
  endSession(reason: 'Completed' | 'Cancelled'): SessionEndResult {
    this.state.isRunning = false;

    // Create final system events using the helper method
    const endTimerEvent = this.createEndEventForCurrentTimer();

    const endSessionEvent = this.createSystemEvent('Escape', 0, 'End of Session', 'Primary' as KeyTiming, 'End');

    const finalSystemKeys = [...this.systemKeysPressed, endTimerEvent, endSessionEvent];

    // Convert special key timers Map to Record
    const specialKeyTimersRecord: Record<string, number> = {};
    this.state.specialKeyTimers.forEach((value, key) => {
      specialKeyTimersRecord[key] = value;
    });

    const result: SessionEndResult = {
      reason,
      keysPressed: [...this.keysPressed],
      systemKeysPressed: finalSystemKeys,
      timers: {
        total: this.state.secondsElapsedTotal,
        first: this.state.secondsElapsedFirst,
        second: this.state.secondsElapsedSecond,
        third: this.state.secondsElapsedThird,
      },
      specialKeyTimers: specialKeyTimersRecord,
      startTime: this.state.startTime ? formatTimestamp(this.state.startTime) : null,
    };

    // Reset state for potential reuse
    this.resetState();

    return result;
  }

  /**
   * Creates a system event
   */
  private createSystemEvent(
    keyName: string,
    keyCode: number,
    description: string,
    keyTiming: KeyTiming,
    scheduleIndicator: 'Start' | 'End',
    timestamp?: number,
  ): KeyManageType {
    const eventTime = timestamp || getHighResTime();
    return {
      KeyName: keyName,
      KeyCode: keyCode,
      KeyDescription: description,
      TimePressed: new Date(Date.now() - (performance.now() - eventTime)),
      KeyScheduleRecording: keyTiming,
      KeyType: 'System',
      TimeIntoSession: this.state.secondsElapsedTotal,
      ScheduleIndicator: scheduleIndicator,
    };
  }

  /**
   * Creates a key event
   */
  private createKeyEvent(
    keyName: string,
    keyCode: number,
    description: string,
    keyType: 'Frequency' | 'Duration',
    timestamp: number,
  ): KeyManageType {
    return {
      KeyName: keyName,
      KeyCode: keyCode,
      KeyDescription: description,
      TimePressed: new Date(Date.now() - (performance.now() - timestamp)),
      KeyScheduleRecording: this.state.activeTimer as KeyTiming,
      KeyType: keyType,
      TimeIntoSession: this.state.secondsElapsedTotal,
    };
  }

  /**
   * Gets the current state (useful for testing)
   */
  getState(): Readonly<SessionState> {
    return { ...this.state };
  }

  /**
   * Gets the current keys pressed (useful for testing)
   */
  getKeysPressed(): Readonly<KeyManageType[]> {
    return [...this.keysPressed];
  }

  /**
   * Gets the current system keys pressed (useful for testing)
   */
  getSystemKeysPressed(): Readonly<KeyManageType[]> {
    return [...this.systemKeysPressed];
  }

  /**
   * Gets UI update interval
   */
  getUiUpdateInterval(): number {
    return this.uiUpdateInterval;
  }

  /**
   * Gets timer constants (useful for testing timing calculations)
   */
  static getTimerConstants() {
    return {
      TIME_DELTA,
      TIME_UNIT,
      INCREMENT,
    };
  }
}
