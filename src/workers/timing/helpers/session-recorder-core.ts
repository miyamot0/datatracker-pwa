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

    // Check if session should end before updating timers
    const shouldEnd = this.checkSessionEnd();

    // Update timers
    this.state.secondsElapsedTotal += INCREMENT;
    this.state.secondsElapsedActive += INCREMENT;

    // Increment the appropriate timer based on the active timer
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

    const timerUpdate: TimerUpdatePayload = {
      total: this.state.secondsElapsedTotal,
      first: this.state.secondsElapsedFirst,
      second: this.state.secondsElapsedSecond,
      third: this.state.secondsElapsedThird,
      active: this.state.secondsElapsedActive,
      activeTimer: this.state.activeTimer,
    };

    return { shouldEnd, timerUpdate };
  }

  /**
   * Checks if the session should end based on timer settings
   */
  private checkSessionEnd(): boolean {
    if (!this.settings) return false;

    switch (this.settings.TimerOption) {
      case 'End on Primary Timer':
        return this.state.secondsElapsedTotal + INCREMENT >= this.settings.DurationS;
      case 'End on Timer #1':
        return this.state.secondsElapsedFirst + INCREMENT >= this.settings.DurationS;
      case 'End on Timer #2':
        return this.state.secondsElapsedSecond + INCREMENT >= this.settings.DurationS;
      case 'End on Timer #3':
        return this.state.secondsElapsedThird + INCREMENT >= this.settings.DurationS;
      default:
        return false;
    }
  }

  /**
   * Switches the active timer
   */
  switchTimer(timer: 'Primary' | 'Secondary' | 'Tertiary'): KeyManageType[] | null {
    if (!this.state.isRunning || this.state.activeTimer === timer) return null;

    // Create end event for previous timer
    const endEvent = this.createSystemEvent(
      this.state.activeTimer,
      0,
      `End of ${this.state.activeTimer}`,
      this.state.activeTimer as KeyTiming,
      'End',
    );

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
   * Processes a key press
   */
  processKey(keyName: string, keyCode: number): { key: KeyManageType; totalKeys: number } | null {
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

    // Create final system events
    const endTimerEvent = this.createSystemEvent(
      this.state.activeTimer,
      0,
      `End of ${this.state.activeTimer}`,
      this.state.activeTimer as KeyTiming,
      'End',
    );

    const endSessionEvent = this.createSystemEvent(
      'Escape',
      0,
      'End of Session',
      this.state.activeTimer as KeyTiming,
      'End',
    );

    const finalSystemKeys = [...this.systemKeysPressed, endTimerEvent, endSessionEvent];

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
