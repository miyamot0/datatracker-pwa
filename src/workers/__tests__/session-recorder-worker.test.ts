import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SavedSettings } from '@/lib/dtos/session-settings';
import { KeySet } from '@/types/keyset/core';
import { WorkerMessage } from '../timing/types/session-recorder-worker-messaging';

// Create mock class using vi.hoisted for proper constructor support in Vitest 4+
const mockCores = vi.hoisted(() => [] as any[]);
const MockSessionRecorderCore = vi.hoisted(() => {
  return class MockSessionRecorderCore {
    constructor() {
      mockCores.push(this);
    }
    init = vi.fn();
    startSession = vi.fn(() => ({
      systemEvents: [{ KeyName: 'Start', KeyType: 'System' }],
      startTime: 123456,
    }));
    getState = vi.fn(() => ({
      activeTimer: 'Primary',
      isRunning: false,
    }));
    getUiUpdateInterval = vi.fn(() => 50);
    updateTimers = vi.fn(() => ({
      shouldEnd: false,
      timerUpdate: { total: 1, first: 1, second: 0, third: 0, active: 1, activeTimer: 'Primary' },
    }));
    switchTimer = vi.fn(() => [{ KeyName: 'Switch', KeyType: 'System' }]);
    switchToSpecialKey = vi.fn(() => [{ KeyName: 'SpecialSwitch', KeyType: 'System' }]);
    processKey = vi.fn(() => ({ key: { KeyName: 'A' }, totalKeys: 1 }));
    deleteLastKey = vi.fn(() => ({ deletedKey: { KeyName: 'A' }, totalKeys: 0 }));
    endSession = vi.fn(() => ({
      reason: 'Completed',
      keysPressed: [],
      systemKeysPressed: [],
      timers: { total: 0, first: 0, second: 0, third: 0 },
      startTime: null,
    }));

    // @ts-ignore
    static getTimerConstants = vi.fn(() => ({ TIME_DELTA: 10, TIME_UNIT: 1000, INCREMENT: 0.01 }));
  };
});

// The worker imports the core from src/lib/recorder-core
vi.mock('../../lib/recorder-core', () => ({
  SessionRecorderCore: MockSessionRecorderCore,
  getHighResTime: vi.fn(() => performance.now()),
}));

// Mock global self before the worker module is imported; the worker assigns self.onmessage at import time
const { mockPostMessage, mockSelf } = vi.hoisted(() => {
  const mockPostMessage = vi.fn();
  const mockSelf = {
    postMessage: mockPostMessage,
    onmessage: null as ((event: MessageEvent<any>) => void) | null,
  };
  Object.defineProperty(globalThis, 'self', {
    value: mockSelf,
    writable: true,
    configurable: true,
  });
  return { mockPostMessage, mockSelf };
});

// Import after mocking
import '../timing/session-recorder-worker';

describe('SessionRecorderWorker', () => {
  // The worker constructs one core at import time; this is that instance.
  // The worker constructs one core at import time; this is that instance.
  const core = () => mockCores[0];
  let mockSettings: SavedSettings;
  let mockKeyset: KeySet;
  let mockMessagePort: MessagePort;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSettings = {
      DurationS: 10,
      TimerOption: 'End on Primary Timer',
    } as SavedSettings;

    mockKeyset = {
      FrequencyKeys: [{ KeyName: 'A', KeyCode: 65, KeyDescription: 'Letter A' }],
      DurationKeys: [{ KeyName: '1', KeyCode: 49, KeyDescription: 'Number 1' }],
    } as KeySet;

    mockMessagePort = {
      postMessage: vi.fn(),
      onmessage: null,
      onmessageerror: null,
      close: vi.fn(),
      start: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MessagePort;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Message Handling', () => {
    it('should handle SETUP_CHANNEL message', () => {
      const message: WorkerMessage = {
        type: 'SETUP_CHANNEL',
        ports: [mockMessagePort],
      };

      const event = new MessageEvent('message', { data: message });

      mockSelf.onmessage?.(event);
      // The channel is only used for timer updates; setup itself posts nothing to the main thread.
      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it('should handle INIT message with valid payload', () => {
      const message: WorkerMessage = {
        type: 'INIT',
        payload: {
          settings: mockSettings,
          keyset: mockKeyset,
          uiPollingInterval: 'normal',
        },
      };

      const event = new MessageEvent('message', { data: message });

      mockSelf.onmessage?.(event);
      expect(core().init).toHaveBeenCalledWith(mockSettings, mockKeyset, 'normal');
    });

    it('should ignore INIT message with missing payload', () => {
      const message: WorkerMessage = {
        type: 'INIT',
      };

      const event = new MessageEvent('message', { data: message });

      mockSelf.onmessage?.(event);
      expect(core().init).not.toHaveBeenCalled();
    });

    it('should handle START_SESSION message', () => {
      // First initialize
      const initMessage: WorkerMessage = {
        type: 'INIT',
        payload: {
          settings: mockSettings,
          keyset: mockKeyset,
          uiPollingInterval: 'normal',
        },
      };
      mockSelf.onmessage?.(new MessageEvent('message', { data: initMessage }));

      const message: WorkerMessage = {
        type: 'START_SESSION',
      };

      const event = new MessageEvent('message', { data: message });

      mockSelf.onmessage?.(event);
      expect(core().startSession).toHaveBeenCalledTimes(1);
      expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'SYSTEM_EVENT' }));
    });

    it('should handle STOP_SESSION message with reason', () => {
      // endSession only runs when the core reports a running session
      core().getState.mockReturnValueOnce({ activeTimer: 'Primary', isRunning: true });

      const message: WorkerMessage = {
        type: 'STOP_SESSION',
        payload: { reason: 'Cancelled' },
      };

      const event = new MessageEvent('message', { data: message });

      mockSelf.onmessage?.(event);
      expect(core().endSession).toHaveBeenCalledWith('Cancelled');
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SESSION_ENDED', payload: expect.objectContaining({ reason: 'Completed' }) }),
      );
    });

    it('should handle SWITCH_TIMER message', () => {
      const message: WorkerMessage = {
        type: 'SWITCH_TIMER',
        payload: { timer: 'Secondary' },
      };

      const event = new MessageEvent('message', { data: message });

      mockSelf.onmessage?.(event);
      expect(core().switchTimer).toHaveBeenCalledWith('Secondary');
      expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'SYSTEM_EVENT' }));
    });

    it('should handle SWITCH_SPECIAL_KEY message', () => {
      const message: WorkerMessage = {
        type: 'SWITCH_SPECIAL_KEY',
        payload: { specialKeyName: 'Duration1' },
      };

      const event = new MessageEvent('message', { data: message });

      mockSelf.onmessage?.(event);
      expect(core().switchToSpecialKey).toHaveBeenCalledWith('Duration1');
      expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'SYSTEM_EVENT' }));
    });

    it('should handle PROCESS_KEY message', () => {
      const message: WorkerMessage = {
        type: 'PROCESS_KEY',
        payload: { keyName: 'A', keyCode: 65 },
      };

      const event = new MessageEvent('message', { data: message });

      mockSelf.onmessage?.(event);
      expect(core().processKey).toHaveBeenCalledWith('A', 65);
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'KEY_PROCESSED',
        payload: { key: { KeyName: 'A' }, totalKeys: 1 },
      });
    });

    it('should handle DELETE_LAST_KEY message', () => {
      const message: WorkerMessage = {
        type: 'DELETE_LAST_KEY',
      };

      const event = new MessageEvent('message', { data: message });

      mockSelf.onmessage?.(event);
      expect(core().deleteLastKey).toHaveBeenCalledTimes(1);
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'KEY_DELETED',
        payload: { deletedKey: { KeyName: 'A' }, totalKeys: 0 },
      });
    });

    it('should ignore messages with missing required payload fields', () => {
      const messages: WorkerMessage[] = [
        { type: 'SWITCH_TIMER' }, // Missing timer
        { type: 'SWITCH_SPECIAL_KEY' }, // Missing specialKeyName
        { type: 'PROCESS_KEY', payload: { keyName: 'A' } }, // Missing keyCode
        { type: 'PROCESS_KEY', payload: { keyCode: 65 } }, // Missing keyName
        { type: 'STOP_SESSION' }, // Missing reason
      ];

      messages.forEach((message) => {
        mockSelf.onmessage?.(new MessageEvent('message', { data: message }));
      });

      expect(core().switchTimer).not.toHaveBeenCalled();
      expect(core().switchToSpecialKey).not.toHaveBeenCalled();
      expect(core().processKey).not.toHaveBeenCalled();
      expect(core().endSession).not.toHaveBeenCalled();
    });

  });

  describe('Timer Integration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should handle timer-based operations without throwing', () => {
      // Initialize worker
      const initMessage: WorkerMessage = {
        type: 'INIT',
        payload: {
          settings: mockSettings,
          keyset: mockKeyset,
          uiPollingInterval: 'normal',
        },
      };
      mockSelf.onmessage?.(new MessageEvent('message', { data: initMessage }));

      // Start session
      const startMessage: WorkerMessage = {
        type: 'START_SESSION',
      };

      mockSelf.onmessage?.(new MessageEvent('message', { data: startMessage }));
      expect(core().startSession).toHaveBeenCalledTimes(1);

      // Advance timers
      vi.advanceTimersByTime(100);
      expect(core().updateTimers).toHaveBeenCalled();
    });

    it('should handle session stop during timer execution', () => {
      vi.useFakeTimers();

      // Initialize and start session
      const initMessage: WorkerMessage = {
        type: 'INIT',
        payload: {
          settings: mockSettings,
          keyset: mockKeyset,
          uiPollingInterval: 'normal',
        },
      };
      mockSelf.onmessage?.(new MessageEvent('message', { data: initMessage }));

      const startMessage: WorkerMessage = {
        type: 'START_SESSION',
      };
      mockSelf.onmessage?.(new MessageEvent('message', { data: startMessage }));

      const stopMessage: WorkerMessage = {
        type: 'STOP_SESSION',
        payload: { reason: 'Cancelled' },
      };

      core().getState.mockReturnValueOnce({ activeTimer: 'Primary', isRunning: true });
      mockSelf.onmessage?.(new MessageEvent('message', { data: stopMessage }));
      expect(core().endSession).toHaveBeenCalledWith('Cancelled');
    });
  });

  describe('MessageChannel Integration', () => {
    it('should setup message channel when provided', () => {
      const message: WorkerMessage = {
        type: 'SETUP_CHANNEL',
        ports: [mockMessagePort],
      };

      const event = new MessageEvent('message', { data: message });

      expect(() => mockSelf.onmessage?.(event)).not.toThrow();
    });

    it('should ignore setup channel with no ports', () => {
      const message: WorkerMessage = {
        type: 'SETUP_CHANNEL',
      };

      const event = new MessageEvent('message', { data: message });

      expect(() => mockSelf.onmessage?.(event)).not.toThrow();
    });

    it('should handle high-frequency updates with MessageChannel', async () => {
      vi.useFakeTimers();

      // Setup channel first
      const channelMessage: WorkerMessage = {
        type: 'SETUP_CHANNEL',
        ports: [mockMessagePort],
      };
      mockSelf.onmessage?.(new MessageEvent('message', { data: channelMessage }));

      // Initialize worker
      const initMessage: WorkerMessage = {
        type: 'INIT',
        payload: {
          settings: mockSettings,
          keyset: mockKeyset,
          uiPollingInterval: 'normal',
        },
      };

      expect(() => mockSelf.onmessage?.(new MessageEvent('message', { data: initMessage }))).not.toThrow();
    });
  });

  describe('Core Integration', () => {
    it('should integrate with core for all operations', () => {
      const operations = [
        { type: 'SWITCH_TIMER', payload: { timer: 'Secondary' } },
        { type: 'SWITCH_SPECIAL_KEY', payload: { specialKeyName: 'Duration1' } },
        { type: 'PROCESS_KEY', payload: { keyName: 'A', keyCode: 65 } },
        { type: 'DELETE_LAST_KEY' },
      ] as WorkerMessage[];

      operations.forEach((message) => {
        expect(() => mockSelf.onmessage?.(new MessageEvent('message', { data: message }))).not.toThrow();
      });
    });

    it('should handle core operations that return null gracefully', () => {
      const messages: WorkerMessage[] = [
        { type: 'START_SESSION' },
        { type: 'SWITCH_TIMER', payload: { timer: 'Secondary' } },
        { type: 'SWITCH_SPECIAL_KEY', payload: { specialKeyName: 'Duration1' } },
        { type: 'PROCESS_KEY', payload: { keyName: 'A', keyCode: 65 } },
        { type: 'DELETE_LAST_KEY' },
      ];

      messages.forEach((message) => {
        expect(() => mockSelf.onmessage?.(new MessageEvent('message', { data: message }))).not.toThrow();
      });
    });
  });

  describe('Error Handling', () => {
    it('should not reach the core for malformed messages', () => {
      // Null and undefined data throw in the worker's destructuring today; no malformed input may reach the core.
      const throwingEvents = [
        new MessageEvent('message', { data: null }),
        new MessageEvent('message', { data: undefined }),
      ];
      throwingEvents.forEach((event) => {
        // @ts-ignore
        expect(() => mockSelf.onmessage?.(event)).toThrow(TypeError);
      });

      const ignoredEvents = [
        new MessageEvent('message', { data: {} }),
        new MessageEvent('message', { data: { type: 'UNKNOWN_TYPE' } }),
      ];
      ignoredEvents.forEach((event) => {
        // @ts-ignore
        mockSelf.onmessage?.(event);
      });

      expect(core().init).not.toHaveBeenCalled();
      expect(core().startSession).not.toHaveBeenCalled();
      expect(core().processKey).not.toHaveBeenCalled();
      expect(core().endSession).not.toHaveBeenCalled();
    });

    it('should handle worker operations without crashing', () => {
      const message: WorkerMessage = {
        type: 'INIT',
        payload: {
          settings: mockSettings,
          keyset: mockKeyset,
          uiPollingInterval: 'normal',
        },
      };

      expect(() => mockSelf.onmessage?.(new MessageEvent('message', { data: message }))).not.toThrow();
    });
  });

  describe('State Management', () => {
    it('should handle session lifecycle operations', () => {
      const lifecycleMessages = [
        { type: 'INIT', payload: { settings: mockSettings, keyset: mockKeyset, uiPollingInterval: 'normal' } },
        { type: 'START_SESSION' },
        { type: 'STOP_SESSION', payload: { reason: 'Cancelled' } },
      ] as WorkerMessage[];

      lifecycleMessages.forEach((message) => {
        expect(() => mockSelf.onmessage?.(new MessageEvent('message', { data: message }))).not.toThrow();
      });
    });

    it('should handle session stop operations', () => {
      const message: WorkerMessage = {
        type: 'STOP_SESSION',
        payload: { reason: 'Cancelled' },
      };

      expect(() => mockSelf.onmessage?.(new MessageEvent('message', { data: message }))).not.toThrow();
    });

    it('should handle operations when session not running', () => {
      const operations = [
        { type: 'SWITCH_TIMER', payload: { timer: 'Secondary' } },
        { type: 'SWITCH_SPECIAL_KEY', payload: { specialKeyName: 'Duration1' } },
        { type: 'PROCESS_KEY', payload: { keyName: 'A', keyCode: 65 } },
        { type: 'DELETE_LAST_KEY' },
      ] as WorkerMessage[];

      operations.forEach((message) => {
        expect(() => mockSelf.onmessage?.(new MessageEvent('message', { data: message }))).not.toThrow();
      });
    });
  });
});
