import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { WorkerMessage } from '../timing/types/session-recorder-worker-messaging';

const { mockCores, MockSessionRecorderCore } = vi.hoisted(() => {
  const mockCores: any[] = [];
  class MockSessionRecorderCore {
    constructor() {
      mockCores.push(this);
    }
    init = vi.fn();
    startSession = vi.fn(() => ({
      systemEvents: [{ KeyName: 'Start', KeyType: 'System' }],
      startTime: 1000,
    }));
    getState = vi.fn(() => ({ activeTimer: 'Primary', activeSpecialKey: null, isRunning: false }));
    getUiUpdateInterval = vi.fn(() => 50);
    updateTimers = vi.fn(() => ({
      shouldEnd: false,
      timerUpdate: { total: 1, first: 1, second: 0, third: 0, active: 1, activeTimer: 'Primary' },
    }));
    switchTimer = vi.fn(() => [{ KeyName: 'Switch', KeyType: 'System' }]);
    switchToSpecialKey = vi.fn(() => [{ KeyName: 'SpecialSwitch', KeyType: 'System' }]);
    processKey = vi.fn(() => ({ key: { KeyName: 'A' }, totalKeys: 1 }));
    deleteLastKey = vi.fn(() => ({ deletedKey: { KeyName: 'A' }, totalKeys: 0 }));
    endSession = vi.fn(() => ({ reason: 'Completed', keysPressed: [], timers: {} }));

    static getTimerConstants = vi.fn(() => ({ TIME_DELTA: 10, TIME_UNIT: 1000, INCREMENT: 0.01 }));
  }
  return { mockCores, MockSessionRecorderCore };
});

vi.mock('../../lib/recorder-core', () => ({
  SessionRecorderCore: MockSessionRecorderCore,
  getHighResTime: vi.fn(() => 42),
}));

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

// Each test re-imports the worker so its module-level state (timer, throttle counter, core) starts fresh
async function loadWorker() {
  vi.resetModules();
  mockCores.length = 0;
  mockPostMessage.mockClear();
  mockSelf.onmessage = null;
  await import('../timing/session-recorder-worker');
  const core = mockCores[0];
  const send = (message: WorkerMessage | undefined) =>
    mockSelf.onmessage!(new MessageEvent('message', { data: message }));
  return { core, send };
}

const settings = { DurationS: 10, TimerOption: 'End on Primary Timer' } as any;
const keyset = { FrequencyKeys: [], DurationKeys: [] } as any;
const initMessage: WorkerMessage = {
  type: 'INIT',
  payload: { settings, keyset, uiPollingInterval: 'normal' },
} as any;

const port = () => ({ postMessage: vi.fn() }) as unknown as MessagePort;

describe('session-recorder-worker paths', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('timer loop', () => {
    it('ends the session as Completed when the core reports shouldEnd, then stops ticking', async () => {
      const { core, send } = await loadWorker();
      core.getState.mockReturnValue({ activeTimer: 'Primary', activeSpecialKey: null, isRunning: true });
      core.endSession.mockReturnValue({ reason: 'Completed', keysPressed: [] });
      core.updateTimers.mockReturnValueOnce({ shouldEnd: true, timerUpdate: null });
      send(initMessage);
      send({ type: 'START_SESSION' });

      vi.advanceTimersByTime(10);

      expect(core.endSession).toHaveBeenCalledWith('Completed');
      expect(mockPostMessage).toHaveBeenLastCalledWith({
        type: 'SESSION_ENDED',
        payload: { reason: 'Completed', keysPressed: [] },
      });

      const ticksAfterEnd = core.updateTimers.mock.calls.length;
      vi.advanceTimersByTime(100);
      expect(core.updateTimers.mock.calls.length).toBe(ticksAfterEnd);
    });

    it('does not post TIMER_UPDATE when the core returns no timerUpdate on a throttle boundary', async () => {
      const { core, send } = await loadWorker();
      core.updateTimers.mockReturnValue({ shouldEnd: false, timerUpdate: null });
      send(initMessage);
      send({ type: 'START_SESSION' });

      vi.advanceTimersByTime(100);

      expect(core.updateTimers).toHaveBeenCalled();
      expect(mockPostMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'TIMER_UPDATE' }));
    });

    it('throttles TIMER_UPDATE to the UI interval (every 50ms at a 10ms tick)', async () => {
      const { send } = await loadWorker();
      send(initMessage);
      send({ type: 'START_SESSION' });
      mockPostMessage.mockClear();

      vi.advanceTimersByTime(40);
      expect(mockPostMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'TIMER_UPDATE' }));

      vi.advanceTimersByTime(10);
      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'TIMER_UPDATE',
        payload: expect.objectContaining({ activeTimer: 'Primary' }),
        timestamp: 42,
      });
    });

    it('sends high-frequency updates over the MessageChannel port when one is set up', async () => {
      const { send } = await loadWorker();
      const channel = port();
      send({ type: 'SETUP_CHANNEL', ports: [channel] } as any);
      send(initMessage);
      send({ type: 'START_SESSION' });
      mockPostMessage.mockClear();

      vi.advanceTimersByTime(50);

      expect(channel.postMessage).toHaveBeenCalledWith({
        type: 'HIGH_FREQ_UPDATE',
        payload: expect.objectContaining({ activeTimer: 'Primary' }),
        timestamp: 42,
      });
      expect(mockPostMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'TIMER_UPDATE' }));
    });

    it('does not start a second timer when startSession is called twice', async () => {
      const { core, send } = await loadWorker();
      send(initMessage);
      send({ type: 'START_SESSION' });
      send({ type: 'START_SESSION' });

      vi.advanceTimersByTime(10);

      expect(core.startSession).toHaveBeenCalledTimes(2);
      expect(core.updateTimers).toHaveBeenCalledTimes(1);
    });
  });

  describe('startSession', () => {
    it('posts nothing and starts no timer when the core returns no result', async () => {
      const { core, send } = await loadWorker();
      core.startSession.mockReturnValueOnce(null as any);
      send(initMessage);
      send({ type: 'START_SESSION' });

      vi.advanceTimersByTime(100);

      expect(mockPostMessage).not.toHaveBeenCalled();
      expect(core.updateTimers).not.toHaveBeenCalled();
    });

    it('posts the start SYSTEM_EVENT with the active timer and isRunning', async () => {
      const { send } = await loadWorker();
      send(initMessage);
      send({ type: 'START_SESSION' });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'SYSTEM_EVENT',
        payload: {
          events: [{ KeyName: 'Start', KeyType: 'System' }],
          activeTimer: 'Primary',
          activeSpecialKey: null,
          isRunning: true,
        },
        timestamp: 1000,
      });
    });
  });

  describe('stopSession', () => {
    it('does nothing when the core reports the session is not running', async () => {
      const { core, send } = await loadWorker();
      send(initMessage);
      send({ type: 'STOP_SESSION', payload: { reason: 'Cancelled' } } as any);

      expect(core.endSession).not.toHaveBeenCalled();
      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it('ends a running session that never started a timer, without clearing an interval', async () => {
      const { core, send } = await loadWorker();
      core.getState.mockReturnValue({ activeTimer: 'Primary', activeSpecialKey: null, isRunning: true });
      send(initMessage);
      send({ type: 'STOP_SESSION', payload: { reason: 'Cancelled' } } as any);

      expect(core.endSession).toHaveBeenCalledWith('Cancelled');
      expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'SESSION_ENDED' }));
    });

    it('clears the running timer when stopped mid-session', async () => {
      const { core, send } = await loadWorker();
      core.getState.mockReturnValue({ activeTimer: 'Primary', activeSpecialKey: null, isRunning: true });
      send(initMessage);
      send({ type: 'START_SESSION' });
      send({ type: 'STOP_SESSION', payload: { reason: 'Cancelled' } } as any);

      const ticksAtStop = core.updateTimers.mock.calls.length;
      vi.advanceTimersByTime(100);
      expect(core.updateTimers.mock.calls.length).toBe(ticksAtStop);
    });
  });

  describe('core returns no result', () => {
    it('posts nothing for a timer switch the core rejects', async () => {
      const { core, send } = await loadWorker();
      core.switchTimer.mockReturnValueOnce(null as any);
      send(initMessage);
      send({ type: 'SWITCH_TIMER', payload: { timer: 'Secondary' } } as any);

      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it('posts nothing for a special-key switch the core rejects', async () => {
      const { core, send } = await loadWorker();
      core.switchToSpecialKey.mockReturnValueOnce(null as any);
      send(initMessage);
      send({ type: 'SWITCH_SPECIAL_KEY', payload: { specialKeyName: 'X' } } as any);

      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it('posts nothing for a key the core rejects', async () => {
      const { core, send } = await loadWorker();
      core.processKey.mockReturnValueOnce(null as any);
      send(initMessage);
      send({ type: 'PROCESS_KEY', payload: { keyName: 'Z', keyCode: 90 } } as any);

      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it('posts nothing when there is no key to delete', async () => {
      const { core, send } = await loadWorker();
      core.deleteLastKey.mockReturnValueOnce(null as any);
      send(initMessage);
      send({ type: 'DELETE_LAST_KEY' });

      expect(mockPostMessage).not.toHaveBeenCalled();
    });
  });

  describe('message routing', () => {
    it('ignores a SETUP_CHANNEL message without a first port', async () => {
      const { send } = await loadWorker();
      send(initMessage);
      send({ type: 'SETUP_CHANNEL', ports: [] } as any);
      send({ type: 'START_SESSION' });
      mockPostMessage.mockClear();

      vi.advanceTimersByTime(50);

      expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'TIMER_UPDATE' }));
    });

    it('ignores INIT when the keyset is missing', async () => {
      const { core, send } = await loadWorker();
      send({ type: 'INIT', payload: { settings, uiPollingInterval: 'normal' } } as any);

      expect(core.init).not.toHaveBeenCalled();
    });

    it('forwards a valid INIT to the core', async () => {
      const { core, send } = await loadWorker();
      send(initMessage);

      expect(core.init).toHaveBeenCalledWith(settings, keyset, 'normal');
    });

    it('ignores STOP_SESSION without a reason', async () => {
      const { core, send } = await loadWorker();
      core.getState.mockReturnValue({ activeTimer: 'Primary', activeSpecialKey: null, isRunning: true });
      send(initMessage);
      send({ type: 'STOP_SESSION' } as any);

      expect(core.endSession).not.toHaveBeenCalled();
    });

    it('ignores STOP_SESSION with no payload at all', async () => {
      const { core, send } = await loadWorker();
      core.getState.mockReturnValue({ activeTimer: 'Primary', activeSpecialKey: null, isRunning: true });
      send({ type: 'STOP_SESSION' } as any);

      expect(core.endSession).not.toHaveBeenCalled();
    });

    it('ignores INIT with no payload at all', async () => {
      const { core, send } = await loadWorker();
      send({ type: 'INIT' } as any);

      expect(core.init).not.toHaveBeenCalled();
    });

    it('ignores INIT when the UI polling interval is missing', async () => {
      const { core, send } = await loadWorker();
      send({ type: 'INIT', payload: { settings, keyset } } as any);

      expect(core.init).not.toHaveBeenCalled();
    });

    it('stops a running session that never started a timer interval', async () => {
      const { core, send } = await loadWorker();
      core.getState.mockReturnValue({ activeTimer: 'Primary', activeSpecialKey: null, isRunning: true });
      send({ type: 'STOP_SESSION', payload: { reason: 'Cancelled' } } as any);

      expect(core.endSession).toHaveBeenCalled();
    });

    it('ignores SWITCH_TIMER without a timer', async () => {
      const { core, send } = await loadWorker();
      send(initMessage);
      send({ type: 'SWITCH_TIMER', payload: {} } as any);

      expect(core.switchTimer).not.toHaveBeenCalled();
    });

    it('forwards SWITCH_TIMER and posts the resulting SYSTEM_EVENT', async () => {
      const { core, send } = await loadWorker();
      send(initMessage);
      send({ type: 'SWITCH_TIMER', payload: { timer: 'Tertiary' } } as any);

      expect(core.switchTimer).toHaveBeenCalledWith('Tertiary');
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'SYSTEM_EVENT',
        payload: {
          events: [{ KeyName: 'Switch', KeyType: 'System' }],
          activeTimer: 'Primary',
          activeSpecialKey: null,
        },
      });
    });

    it('ignores SWITCH_SPECIAL_KEY without a key name', async () => {
      const { core, send } = await loadWorker();
      send(initMessage);
      send({ type: 'SWITCH_SPECIAL_KEY', payload: {} } as any);

      expect(core.switchToSpecialKey).not.toHaveBeenCalled();
    });

    it('forwards SWITCH_SPECIAL_KEY and posts the resulting SYSTEM_EVENT', async () => {
      const { core, send } = await loadWorker();
      send(initMessage);
      send({ type: 'SWITCH_SPECIAL_KEY', payload: { specialKeyName: 'Y' } } as any);

      expect(core.switchToSpecialKey).toHaveBeenCalledWith('Y');
      expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'SYSTEM_EVENT' }));
    });

    it('ignores PROCESS_KEY unless both keyName and keyCode are present', async () => {
      const { core, send } = await loadWorker();
      send(initMessage);
      send({ type: 'PROCESS_KEY', payload: { keyName: 'A' } } as any);
      send({ type: 'PROCESS_KEY', payload: { keyCode: 65 } } as any);

      expect(core.processKey).not.toHaveBeenCalled();
    });

    it('forwards PROCESS_KEY when both fields are present, including a zero key code', async () => {
      const { core, send } = await loadWorker();
      send(initMessage);
      send({ type: 'PROCESS_KEY', payload: { keyName: 'A', keyCode: 0 } } as any);

      expect(core.processKey).toHaveBeenCalledWith('A', 0);
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'KEY_PROCESSED',
        payload: { key: { KeyName: 'A' }, totalKeys: 1 },
      });
    });

    it('forwards DELETE_LAST_KEY and posts KEY_DELETED', async () => {
      const { core, send } = await loadWorker();
      send(initMessage);
      send({ type: 'DELETE_LAST_KEY' });

      expect(core.deleteLastKey).toHaveBeenCalled();
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'KEY_DELETED',
        payload: { deletedKey: { KeyName: 'A' }, totalKeys: 0 },
      });
    });

    it('ignores an unrecognised message type', async () => {
      const { core, send } = await loadWorker();
      send({ type: 'UNKNOWN_TYPE' } as any);

      expect(core.init).not.toHaveBeenCalled();
      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it('ignores a message with no data payload', async () => {
      const { core, send } = await loadWorker();
      send(undefined);

      expect(core.init).not.toHaveBeenCalled();
      expect(mockPostMessage).not.toHaveBeenCalled();
    });
  });
});
