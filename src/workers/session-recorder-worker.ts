import { KeySet } from '@/types/keyset';
import { SavedSettings } from '@/lib/dtos';
import { KeyManageType, KeyTiming, TimerSetting } from '../components/session-recorder/types/session-recorder-types';

const TIME_DELTA = 50; /** Polling interval in milliseconds */
const TIME_UNIT = 1000; /** Number of milliseconds in one second */
const INCREMENT = TIME_DELTA / TIME_UNIT; /** Increment value for timers, i.e., 20 hz */

// UI update throttling - send UI updates less frequently than data collection (interesting option to toggle?)
const UI_UPDATE_INTERVAL = 50; // Update UI every 100ms (10Hz) instead of 50ms
let uiUpdateCounter = 0;

// High-precision timing
const getHighResTime = (): number => {
  return performance.now();
};

const formatTimestamp = (perfTime: number): string => {
  // Convert performance.now() time to ISO string equivalent
  return new Date(Date.now() - (performance.now() - perfTime)).toJSON();
};

/**
 * Typing for worker messaging (Main --> Worker)
 */
export interface WorkerMessage {
  type:
    | 'INIT'
    | 'START_SESSION'
    | 'STOP_SESSION'
    | 'SWITCH_TIMER'
    | 'PROCESS_KEY'
    | 'DELETE_LAST_KEY'
    | 'SETUP_CHANNEL';
  payload?: any;
  ports?: MessagePort[];
}

/**
 * Typing for worker messaging (Worker --> Main)
 */
export interface WorkerResponse {
  type: 'TIMER_UPDATE' | 'KEY_PROCESSED' | 'SESSION_ENDED' | 'SYSTEM_EVENT' | 'KEY_DELETED' | 'HIGH_FREQ_UPDATE';
  payload?: any;
  timestamp?: number;
}

/**
 * Worker State (Note: previously in main thread)
 */
class SessionRecorderWorker {
  private settings: SavedSettings | null = null;
  private keyset: KeySet | null = null;
  private keysPressed: KeyManageType[] = [];
  private systemKeysPressed: KeyManageType[] = [];

  private secondsElapsedTotal = 0;
  private secondsElapsedFirst = 0;
  private secondsElapsedSecond = 0;
  private secondsElapsedThird = 0;
  private secondsElapsedActive = 0;

  private activeTimer: TimerSetting = 'Stopped';
  private startTime: number | null = null; // Now using performance.now()
  private timerInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  // MessageChannel for high-frequency updates
  private messageChannel: MessagePort | null = null;

  /**
   * Sets up MessageChannel for high-frequency communication
   */
  setupChannel(port: MessagePort) {
    this.messageChannel = port;
  }

  /**
   *  Initializes the session recorder worker with the provided settings and keyset. This method sets up the necessary state for the worker to function correctly, including storing the settings and keyset, and resetting any existing state to ensure a clean start for the session recording. The `init` method is typically called when the worker receives an 'INIT' message from the main thread, allowing it to prepare for handling session recording tasks based on the provided configuration.
   * @param settings
   * @param keyset
   */
  init(settings: SavedSettings, keyset: KeySet) {
    this.settings = settings;
    this.keyset = keyset;
    this.resetState();
  }

  /**
   * Resets the state of the session recorder worker to its initial values. This method clears any recorded keys, resets all timers to zero, sets the active timer to 'Stopped', and clears the start time. Additionally, it ensures that any existing timer intervals are cleared to prevent unintended behavior.
   */
  private resetState() {
    this.keysPressed = [];
    this.systemKeysPressed = [];
    this.secondsElapsedTotal = 0;
    this.secondsElapsedFirst = 0;
    this.secondsElapsedSecond = 0;
    this.secondsElapsedThird = 0;
    this.secondsElapsedActive = 0;
    this.activeTimer = 'Stopped';
    this.startTime = null;
    this.isRunning = false;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Call to start the session recording. This method checks if the worker has been initialized with settings and is not already running before starting the session. It sets the start time, marks the session as running, initializes the active timer to 'Primary', and resets the active timer's elapsed time.
   */
  startSession() {
    if (!this.settings || this.isRunning) return;

    this.startTime = getHighResTime();
    this.isRunning = true;
    this.activeTimer = 'Primary';
    this.secondsElapsedActive = 0;

    const sessionStartTimestamp = getHighResTime();

    // Create initial system events for the start of the session and the primary timer with high-precision timestamps
    const sessionStartEvent: KeyManageType = {
      KeyName: 'Enter',
      KeyCode: 13,
      KeyDescription: 'Start of Session',
      TimePressed: new Date(Date.now() - (performance.now() - sessionStartTimestamp)),
      KeyScheduleRecording: this.activeTimer as KeyTiming,
      KeyType: 'System',
      TimeIntoSession: this.secondsElapsedTotal,
      ScheduleIndicator: 'Start',
    };

    const primaryStartEvent: KeyManageType = {
      KeyName: 'Primary',
      KeyCode: 0,
      KeyDescription: 'Start of Primary',
      TimePressed: new Date(),
      KeyScheduleRecording: 'Primary' as KeyTiming,
      KeyType: 'System',
      TimeIntoSession: this.secondsElapsedTotal,
      ScheduleIndicator: 'Start',
    };

    // Add system events for session start
    this.systemKeysPressed.push(sessionStartEvent, primaryStartEvent);
    this.postMessage({
      type: 'SYSTEM_EVENT',
      payload: {
        events: [sessionStartEvent, primaryStartEvent],
        activeTimer: this.activeTimer,
        isRunning: true,
      },
      timestamp: sessionStartTimestamp,
    });

    // Start the timer for the session.
    this.startTimer();
  }

  /**
   * Start the timer for the session with optimized update frequency.
   */
  private startTimer() {
    if (this.timerInterval) return;

    this.timerInterval = setInterval(() => {
      if (!this.settings) return;

      // Check if session should end based on timer option
      const shouldEnd = this.checkSessionEnd();

      // Fire end session if needed before updating timers to ensure accurate timing for end events
      if (shouldEnd) {
        this.endSession('Completed');
        return;
      }

      // Update global/specific timers regardless
      this.secondsElapsedTotal += INCREMENT;

      // Note: Active timer general but also specific increment for easier tracking
      this.secondsElapsedActive += INCREMENT;

      // Increment the appropriate timer based on the active timer
      switch (this.activeTimer) {
        case 'Primary':
          this.secondsElapsedFirst += INCREMENT;
          break;
        case 'Secondary':
          this.secondsElapsedSecond += INCREMENT;
          break;
        case 'Tertiary':
          this.secondsElapsedThird += INCREMENT;
          break;
      }

      // Throttled UI updates - only send UI updates every UI_UPDATE_INTERVAL
      uiUpdateCounter += TIME_DELTA;
      if (uiUpdateCounter >= UI_UPDATE_INTERVAL) {
        uiUpdateCounter = 0;

        const updatePayload = {
          total: this.secondsElapsedTotal,
          first: this.secondsElapsedFirst,
          second: this.secondsElapsedSecond,
          third: this.secondsElapsedThird,
          active: this.secondsElapsedActive,
          activeTimer: this.activeTimer,
        };

        // Send via MessageChannel if available for better performance
        if (this.messageChannel) {
          this.messageChannel.postMessage({
            type: 'HIGH_FREQ_UPDATE',
            payload: updatePayload,
            timestamp: getHighResTime(),
          });
        } else {
          // Fallback to regular postMessage
          this.postMessage({
            type: 'TIMER_UPDATE',
            payload: updatePayload,
            timestamp: getHighResTime(),
          });
        }
      }
    }, TIME_DELTA);
  }

  /**
   * Checks if the session should end based on the configured timer option in the settings. This method evaluates the elapsed time for the active timer against the specified duration in the settings, determining whether the session has reached its end condition according to the selected timer option (e.g., primary, secondary, tertiary, or total duration).
   * @returns A boolean value indicating whether the session should end.
   */
  private checkSessionEnd(): boolean {
    if (!this.settings) return false;

    switch (this.settings.TimerOption) {
      case 'End on Primary Timer':
        return this.secondsElapsedTotal + INCREMENT >= this.settings.DurationS;
      case 'End on Timer #1':
        return this.secondsElapsedFirst + INCREMENT >= this.settings.DurationS;
      case 'End on Timer #2':
        return this.secondsElapsedSecond + INCREMENT >= this.settings.DurationS;
      case 'End on Timer #3':
        return this.secondsElapsedThird + INCREMENT >= this.settings.DurationS;
      default:
        return false;
    }
  }

  /**
   * Switches the active timer to the specified timer (Primary, Secondary, or Tertiary).
   * @param timer - The timer to switch to, which can be 'Primary', 'Secondary', or 'Tertiary'
   */
  switchTimer(timer: 'Primary' | 'Secondary' | 'Tertiary') {
    if (!this.isRunning || this.activeTimer === timer) return;

    // Create end event for previous timer
    const endEvent: KeyManageType = {
      KeyName: this.activeTimer,
      KeyCode: 0,
      KeyDescription: `End of ${this.activeTimer}`,
      TimePressed: new Date(),
      KeyScheduleRecording: this.activeTimer as KeyTiming,
      KeyType: 'System',
      TimeIntoSession: this.secondsElapsedTotal,
      ScheduleIndicator: 'End',
    };

    // Switch to new timer
    this.activeTimer = timer;
    this.secondsElapsedActive = 0;

    // Create start event for *new* timer
    const startEvent: KeyManageType = {
      KeyName: this.activeTimer,
      KeyCode: 0,
      KeyDescription: `Start of ${timer}`,
      TimePressed: new Date(),
      KeyScheduleRecording: timer as KeyTiming,
      KeyType: 'System',
      ScheduleIndicator: 'Start',
      TimeIntoSession: this.secondsElapsedTotal,
    };

    // Push system events for timer switch
    this.systemKeysPressed.push(endEvent, startEvent);
    this.postMessage({
      type: 'SYSTEM_EVENT',
      payload: {
        events: [endEvent, startEvent],
        activeTimer: this.activeTimer,
      },
    });
  }

  /**
   * Processes a key event by determining if the key code corresponds to a frequency or duration key in the keyset, creating a `KeyManageType` event object with the relevant details, and sending a message back to the main thread with the processed key information and the total number of keys pressed.
   * @param _keyName - The name of the key being processed (not used in the current implementation but can be utilized for additional logic if needed)
   * @param keyCode - The code of the key being processed, which is used to determine if it corresponds to a frequency or duration key in the keyset and to create the appropriate event object for recording the key press.
   * @returns
   */
  processKey(_keyName: string, keyCode: number) {
    if (!this.isRunning || !this.keyset) return;

    const isFreq = this.keyset.FrequencyKeys.some((key) => key.KeyCode === keyCode);
    const isDur = this.keyset.DurationKeys.some((key) => key.KeyCode === keyCode);

    if (!isFreq && !isDur) return;

    let keyEvent: KeyManageType | null = null;
    const keyTimestamp = getHighResTime();

    // Create entry if relevant Frequency key found
    if (isFreq) {
      const freqKey = this.keyset.FrequencyKeys.find((key) => key.KeyCode === keyCode);
      if (!freqKey) return;

      keyEvent = {
        KeyName: freqKey.KeyName,
        KeyCode: freqKey.KeyCode,
        KeyDescription: freqKey.KeyDescription,
        TimePressed: new Date(Date.now() - (performance.now() - keyTimestamp)),
        KeyScheduleRecording: this.activeTimer as KeyTiming,
        KeyType: 'Frequency',
        TimeIntoSession: this.secondsElapsedTotal,
      };
    }

    // Create entry if relevant Duration key found
    if (isDur) {
      const durKey = this.keyset.DurationKeys.find((key) => key.KeyCode === keyCode);
      if (!durKey) return;

      keyEvent = {
        KeyName: durKey.KeyName,
        KeyCode: durKey.KeyCode,
        KeyDescription: durKey.KeyDescription,
        TimePressed: new Date(Date.now() - (performance.now() - keyTimestamp)),
        KeyScheduleRecording: this.activeTimer as KeyTiming,
        KeyType: 'Duration',
        TimeIntoSession: this.secondsElapsedTotal,
      };
    }

    // If a relevant key event was created, add it to the keysPressed array and send a message back to the main thread with the processed key information and total keys pressed.
    if (keyEvent) {
      this.keysPressed.push(keyEvent);

      this.postMessage({
        type: 'KEY_PROCESSED',
        payload: {
          key: keyEvent,
          totalKeys: this.keysPressed.length,
        },
      });
    }
  }

  /**
   * Deletes the last recorded key event from the keysPressed array and sends a message back to the main thread with the details of the deleted key and the updated total number of keys pressed.
   */
  deleteLastKey() {
    if (this.keysPressed.length === 0) return;

    // Remove the last key event from the keysPressed array and store it in a variable
    const deletedKey = this.keysPressed.pop();

    // Send a message back to the main thread with the details of the deleted key and the updated total number of keys pressed.
    this.postMessage({
      type: 'KEY_DELETED',
      payload: {
        deletedKey,
        totalKeys: this.keysPressed.length,
      },
    });
  }

  /**
   * Stops the session recording by calling the `endSession` method with the provided reason for stopping (either 'Completed' or 'Cancelled').
   * @param reason - The reason for stopping the session, which can be 'Completed' if the session ended naturally based on timer conditions, or 'Cancelled' if the session was manually stopped by the user before completion.
   */
  stopSession(reason: 'Completed' | 'Cancelled') {
    this.endSession(reason);
  }

  /**
   * Ends the session recording by performing necessary cleanup, creating final system events for the end of the session and active timer.
   * @param reason - The reason for ending the session, which can be 'Completed' if the session ended naturally based on timer conditions, or 'Cancelled' if the session was manually stopped by the user before completion.
   */
  private endSession(reason: 'Completed' | 'Cancelled') {
    if (!this.isRunning) return;

    this.isRunning = false;

    // Clear the timer interval to stop the timers from updating further.
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Create final system events
    const endTimerEvent: KeyManageType = {
      KeyName: this.activeTimer,
      KeyCode: 0,
      KeyDescription: `End of ${this.activeTimer}`,
      TimePressed: new Date(),
      KeyScheduleRecording: this.activeTimer as KeyTiming,
      KeyType: 'System',
      TimeIntoSession: this.secondsElapsedTotal,
      ScheduleIndicator: 'End',
    };

    const endSessionEvent: KeyManageType = {
      KeyName: 'Escape',
      KeyCode: 0,
      KeyDescription: 'End of Session',
      TimePressed: new Date(),
      KeyScheduleRecording: this.activeTimer as KeyTiming,
      KeyType: 'System',
      TimeIntoSession: this.secondsElapsedTotal,
      ScheduleIndicator: 'End',
    };

    // Combine existing system keys with final events for the end of the session to ensure a complete record of all system events that occurred during the session, including the start and end of the session and timers.
    const finalSystemKeys = [...this.systemKeysPressed, endTimerEvent, endSessionEvent];

    this.postMessage({
      type: 'SESSION_ENDED',
      payload: {
        reason,
        keysPressed: [...this.keysPressed],
        systemKeysPressed: finalSystemKeys,
        timers: {
          total: this.secondsElapsedTotal,
          first: this.secondsElapsedFirst,
          second: this.secondsElapsedSecond,
          third: this.secondsElapsedThird,
        },
        startTime: this.startTime ? formatTimestamp(this.startTime) : null,
      },
    });

    // Reset state for potential reuse
    this.resetState();
  }

  /**
   * Utility method to post messages back to the main thread with a consistent structure defined by the `WorkerResponse` interface.
   * @param message - The message to be posted to the main thread.
   */
  private postMessage(message: WorkerResponse) {
    self.postMessage(message);
  }
}

// Initialize worker instance
const worker = new SessionRecorderWorker();

// Handle messages from main thread
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, ports } = event.data;

  switch (type) {
    case 'SETUP_CHANNEL':
      if (ports && ports[0]) {
        worker.setupChannel(ports[0]);
      }
      break;
    case 'INIT':
      worker.init(payload.settings, payload.keyset);
      break;
    case 'START_SESSION':
      worker.startSession();
      break;
    case 'STOP_SESSION':
      worker.stopSession(payload.reason);
      break;
    case 'SWITCH_TIMER':
      worker.switchTimer(payload.timer);
      break;
    case 'PROCESS_KEY':
      worker.processKey(payload.keyName, payload.keyCode);
      break;
    case 'DELETE_LAST_KEY':
      worker.deleteLastKey();
      break;
  }
};
