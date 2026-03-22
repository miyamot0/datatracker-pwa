import { KeySet } from '@/types/keyset';
import { SavedSettings } from '@/lib/dtos';
import { SessionRecorderPolling } from '@/types/settings';
import { WorkerMessage, WorkerResponse } from './types/session-recorder-worker-messaging';
import { SessionRecorderCore, getHighResTime } from './helpers/session-recorder-core';

let uiUpdateCounter = 0;

/**
 * Worker wrapper around SessionRecorderCore for web worker communication
 */
class SessionRecorderWorker {
  private core: SessionRecorderCore;
  private timerInterval: NodeJS.Timeout | null = null;
  private messageChannel: MessagePort | null = null;

  constructor() {
    this.core = new SessionRecorderCore();
  }

  /**
   * Sets up MessageChannel for high-frequency communication
   */
  setupChannel(port: MessagePort) {
    this.messageChannel = port;
  }

  /**
   * Initializes the session recorder worker with the provided settings and keyset
   */
  init(settings: SavedSettings, keyset: KeySet, uiPollingInterval: SessionRecorderPolling) {
    this.core.init(settings, keyset, uiPollingInterval);
  }

  /**
   * Starts the session recording
   */
  startSession() {
    const result = this.core.startSession();
    if (!result) return;

    const { systemEvents, startTime } = result;

    this.postMessage({
      type: 'SYSTEM_EVENT',
      payload: {
        events: systemEvents,
        activeTimer: this.core.getState().activeTimer,
        activeSpecialKey: this.core.getState().activeSpecialKey,
        isRunning: true,
      },
      timestamp: startTime,
    });

    this.startTimer();
  }

  /**
   * Start the timer for the session with optimized update frequency
   */
  private startTimer() {
    if (this.timerInterval) return;

    const { TIME_DELTA } = SessionRecorderCore.getTimerConstants();
    const UI_UPDATE_INTERVAL = this.core.getUiUpdateInterval();

    this.timerInterval = setInterval(() => {
      const { shouldEnd, timerUpdate } = this.core.updateTimers();

      // Fire end session if needed before updating timers
      if (shouldEnd) {
        this.endSession('Completed');
        return;
      }

      // Throttled UI updates - only send UI updates every UI_UPDATE_INTERVAL
      uiUpdateCounter += TIME_DELTA;
      if (uiUpdateCounter >= UI_UPDATE_INTERVAL && timerUpdate) {
        uiUpdateCounter = 0;

        // Send via MessageChannel if available for better performance
        if (this.messageChannel) {
          this.messageChannel.postMessage({
            type: 'HIGH_FREQ_UPDATE',
            payload: timerUpdate,
            timestamp: getHighResTime(),
          });
        } else {
          // Fallback to regular postMessage
          this.postMessage({
            type: 'TIMER_UPDATE',
            payload: timerUpdate,
            timestamp: getHighResTime(),
          });
        }
      }
    }, TIME_DELTA);
  }

  /**
   * Switches the active timer to the specified timer
   */
  switchTimer(timer: 'Primary' | 'Secondary' | 'Tertiary') {
    const systemEvents = this.core.switchTimer(timer);
    if (!systemEvents) return;

    this.postMessage({
      type: 'SYSTEM_EVENT',
      payload: {
        events: systemEvents,
        activeTimer: this.core.getState().activeTimer,
        activeSpecialKey: this.core.getState().activeSpecialKey,
      },
    });
  }

  /**
   * Switches to a special duration key timer
   */
  switchToSpecialKey(keyName: string) {
    const systemEvents = this.core.switchToSpecialKey(keyName);
    if (!systemEvents) return;

    this.postMessage({
      type: 'SYSTEM_EVENT',
      payload: {
        events: systemEvents,
        activeTimer: this.core.getState().activeTimer,
        activeSpecialKey: this.core.getState().activeSpecialKey,
      },
    });
  }

  /**
   * Processes a key event
   */
  processKey(keyName: string, keyCode: number) {
    const result = this.core.processKey(keyName, keyCode);
    if (!result) return;

    this.postMessage({
      type: 'KEY_PROCESSED',
      payload: result,
    });
  }

  /**
   * Deletes the last recorded key event
   */
  deleteLastKey() {
    const result = this.core.deleteLastKey();
    if (!result) return;

    this.postMessage({
      type: 'KEY_DELETED',
      payload: result,
    });
  }

  /**
   * Stops the session recording
   */
  stopSession(reason: 'Completed' | 'Cancelled') {
    this.endSession(reason);
  }

  /**
   * Ends the session recording
   */
  private endSession(reason: 'Completed' | 'Cancelled') {
    const state = this.core.getState();
    if (!state.isRunning) return;

    // Clear the timer interval
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const result = this.core.endSession(reason);

    this.postMessage({
      type: 'SESSION_ENDED',
      payload: result,
    });
  }

  /**
   * Utility method to post messages back to the main thread
   */
  private postMessage(message: WorkerResponse) {
    self.postMessage(message);
  }
}

const worker = new SessionRecorderWorker();

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, ports } = event.data;

  switch (type) {
    case 'SETUP_CHANNEL':
      if (ports && ports[0]) {
        worker.setupChannel(ports[0]);
      }
      break;
    case 'INIT':
      if (payload?.settings && payload?.keyset && payload?.uiPollingInterval) {
        worker.init(payload.settings, payload.keyset, payload.uiPollingInterval);
      }
      break;
    case 'START_SESSION':
      worker.startSession();
      break;
    case 'STOP_SESSION':
      if (payload?.reason) {
        worker.stopSession(payload.reason);
      }
      break;
    case 'SWITCH_TIMER':
      if (payload?.timer) {
        worker.switchTimer(payload.timer);
      }
      break;
    case 'SWITCH_SPECIAL_KEY':
      if (payload?.specialKeyName) {
        worker.switchToSpecialKey(payload.specialKeyName);
      }
      break;
    case 'PROCESS_KEY':
      if (payload?.keyName !== undefined && payload?.keyCode !== undefined) {
        worker.processKey(payload.keyName, payload.keyCode);
      }
      break;
    case 'DELETE_LAST_KEY':
      worker.deleteLastKey();
      break;
  }
};
