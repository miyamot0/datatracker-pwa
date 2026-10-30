import '@vitest/web-worker';
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest';
import SessionRecorderWorker from '../timing/session-recorder-worker?worker';
import type { WorkerMessage, WorkerResponse } from '../timing/types/session-recorder-worker-messaging';
import type { SavedSettings } from '@/lib/dtos/session-settings';
import type { KeySet } from '@/types/keyset/core';

const WAIT_OPTIONS = { timeout: 3000, interval: 10 };

describe('SessionRecorderWorker Actual Integration', () => {
  let worker: Worker;
  let received: WorkerResponse[];
  let listener: (event: MessageEvent<WorkerResponse>) => void;

  const mockSettings: SavedSettings = {
    Therapist: 'Test Therapist',
    Condition: 'Test Condition',
    KeySet: 'test-keyset',
    TimerOption: 'End on Primary Timer',
    Initials: 'TT',
    Role: 'Primary',
    Session: 1,
    DurationS: 10,
  };

  const mockKeyset: KeySet = {
    id: 'test-keyset',
    Name: 'Test Keyset',
    FrequencyKeys: [
      { KeyName: 'A', KeyCode: 65, KeyDescription: 'Letter A' },
      { KeyName: 'B', KeyCode: 66, KeyDescription: 'Letter B' },
    ],
    DurationKeys: [
      { KeyName: '1', KeyCode: 49, KeyDescription: 'Number 1' },
      { KeyName: '2', KeyCode: 50, KeyDescription: 'Number 2' },
    ],
    DerivedKeys: [],
    SpecialDurationKeys: [{ KeyName: 'Special1', KeyCode: 191, KeyDescription: 'Special Duration Key 1' }],
    ScorableDurationKeys: [],
    createdAt: new Date(),
    lastModified: new Date(),
  };

  const initMessage = (uiPollingInterval: 'normal' | 'precise' | 'extreme' = 'normal'): WorkerMessage => ({
    type: 'INIT',
    payload: { settings: mockSettings, keyset: mockKeyset, uiPollingInterval },
  });

  const send = (message: unknown, transfer: Transferable[] = []) => worker.postMessage(message, transfer);

  // Index into the received log; used to scope waits to messages sent after a point
  const mark = () => received.length;

  // Waits for the first response of the given type received at or after `from`
  const nextOf = (type: WorkerResponse['type'], from: number) =>
    vi.waitFor(() => {
      const found = received.slice(from).find((msg) => msg.type === type);
      expect(found, `expected ${type} after message index ${from}`).toBeDefined();
      return found as WorkerResponse;
    }, WAIT_OPTIONS);

  const startSession = async () => {
    const from = mark();
    send({ type: 'START_SESSION' });
    return nextOf('SYSTEM_EVENT', from);
  };

  // The worker processes messages in order, so a reply to a later message proves earlier ones were handled
  beforeAll(() => {
    worker = new SessionRecorderWorker();
    received = [];
    listener = (event) => {
      received.push(event.data);
    };
    worker.addEventListener('message', listener);
  });

  afterAll(() => {
    worker.removeEventListener('message', listener);
    worker.terminate();
  });

  beforeEach(async () => {
    send({ type: 'STOP_SESSION', payload: { reason: 'Cancelled' } });
    send(initMessage());
    await startSession();
    const stopFrom = mark();
    send({ type: 'STOP_SESSION', payload: { reason: 'Cancelled' } });
    await nextOf('SESSION_ENDED', stopFrom);
    received.length = 0;
  });

  describe('Worker Instantiation', () => {
    it('should create worker instance successfully', () => {
      expect(worker).toBeInstanceOf(Worker);
    });

    it('should respond to messages after startup', async () => {
      const sys = await startSession();
      expect(sys.payload?.isRunning).toBe(true);
    });
  });

  describe('Initialization', () => {
    it('should not respond to a valid INIT on its own', async () => {
      const from = mark();
      send(initMessage());
      await startSession();

      expect(received.slice(from).map((msg) => msg.type)).toEqual(['SYSTEM_EVENT']);
    });

    it('should ignore INIT messages with incomplete payloads', async () => {
      const from = mark();
      send({ type: 'INIT', payload: { settings: mockSettings } });
      send({ type: 'INIT', payload: { keyset: mockKeyset } });
      send({ type: 'INIT' });
      await startSession();

      expect(received.slice(from).map((msg) => msg.type)).toEqual(['SYSTEM_EVENT']);
    });
  });

  describe('Session Lifecycle', () => {
    it('should emit SYSTEM_EVENT with session state on start', async () => {
      const sys = await startSession();

      expect(sys.payload?.isRunning).toBe(true);
      expect(Array.isArray(sys.payload?.events)).toBe(true);
      expect(sys.payload?.activeTimer).toBeDefined();
      expect(typeof sys.timestamp).toBe('number');
    });

    it('should send timer updates while the session runs', async () => {
      await startSession();
      const from = mark();

      const update = await vi.waitFor(() => {
        const found = received
          .slice(from)
          .find((msg) => msg.type === 'TIMER_UPDATE' || msg.type === 'HIGH_FREQ_UPDATE');
        expect(found).toBeDefined();
        return found as WorkerResponse;
      }, WAIT_OPTIONS);

      expect(typeof update.payload?.total).toBe('number');
      expect(update.payload?.activeTimer).toBeDefined();
    });

    it('should end the session and report the reason on STOP', async () => {
      await startSession();
      const from = mark();
      send({ type: 'STOP_SESSION', payload: { reason: 'Cancelled' } });

      const ended = await nextOf('SESSION_ENDED', from);
      expect(ended.payload?.reason).toBe('Cancelled');
    });

    it('should ignore STOP without a reason', async () => {
      await startSession();
      const from = mark();
      send({ type: 'STOP_SESSION' });
      send({ type: 'STOP_SESSION', payload: { reason: 'Cancelled' } });

      const ended = await nextOf('SESSION_ENDED', from);
      expect(ended.payload?.reason).toBe('Cancelled');
      expect(received.slice(from).filter((msg) => msg.type === 'SESSION_ENDED')).toHaveLength(1);
    });
  });

  describe('Timer Switching', () => {
    beforeEach(async () => {
      send(initMessage());
      await startSession();
    });

    it('should switch the active timer', async () => {
      const from = mark();
      send({ type: 'SWITCH_TIMER', payload: { timer: 'Secondary' } });

      const sys = await nextOf('SYSTEM_EVENT', from);
      expect(sys.payload?.activeTimer).toBe('Secondary');
    });

    it('should switch the active special key', async () => {
      const from = mark();
      send({ type: 'SWITCH_SPECIAL_KEY', payload: { specialKeyName: 'Special1' } });

      const sys = await nextOf('SYSTEM_EVENT', from);
      expect(sys.payload?.activeSpecialKey).toBe('Special1');
    });

    it('should ignore switch messages without required payload', async () => {
      const from = mark();
      send({ type: 'SWITCH_TIMER' });
      send({ type: 'SWITCH_SPECIAL_KEY' });
      send({ type: 'SWITCH_TIMER', payload: { timer: 'Secondary' } });

      await nextOf('SYSTEM_EVENT', from);
      expect(received.slice(from).filter((msg) => msg.type === 'SYSTEM_EVENT')).toHaveLength(1);
    });
  });

  describe('Key Processing', () => {
    beforeEach(async () => {
      send(initMessage());
      await startSession();
    });

    it('should process key events', async () => {
      const from = mark();
      send({ type: 'PROCESS_KEY', payload: { keyName: 'A', keyCode: 65 } });

      const processed = await nextOf('KEY_PROCESSED', from);
      expect(processed.payload?.key).toMatchObject({ KeyName: 'A' });
      expect(processed.payload?.totalKeys).toBe(1);
    });

    it('should delete the last processed key', async () => {
      const from = mark();
      send({ type: 'PROCESS_KEY', payload: { keyName: 'A', keyCode: 65 } });
      await nextOf('KEY_PROCESSED', from);

      const deleteFrom = mark();
      send({ type: 'DELETE_LAST_KEY' });
      const deleted = await nextOf('KEY_DELETED', deleteFrom);
      expect(deleted.payload?.deletedKey).toMatchObject({ KeyName: 'A' });
      expect(deleted.payload?.totalKeys).toBe(0);
    });

    it('should not report a deletion when there are no keys', async () => {
      const from = mark();
      send({ type: 'DELETE_LAST_KEY' });
      send({ type: 'PROCESS_KEY', payload: { keyName: 'A', keyCode: 65 } });

      await nextOf('KEY_PROCESSED', from);
      expect(received.slice(from).some((msg) => msg.type === 'KEY_DELETED')).toBe(false);
    });

    it('should ignore incomplete key processing messages', async () => {
      const from = mark();
      send({ type: 'PROCESS_KEY', payload: { keyName: 'A' } });
      send({ type: 'PROCESS_KEY', payload: { keyCode: 65 } });
      send({ type: 'PROCESS_KEY' });
      send({ type: 'PROCESS_KEY', payload: { keyName: 'A', keyCode: 65 } });

      await nextOf('KEY_PROCESSED', from);
      expect(received.slice(from).filter((msg) => msg.type === 'KEY_PROCESSED')).toHaveLength(1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should survive malformed messages and keep responding', async () => {
      const from = mark();
      const malformed = [null, undefined, {}, { type: 'UNKNOWN_TYPE' }, { type: '', payload: {} }];

      for (const message of malformed) {
        expect(() => send(message)).not.toThrow();
      }

      await startSession();
      expect(received.slice(from).map((msg) => msg.type)).toEqual(['SYSTEM_EVENT']);
    });

    it('should not respond to session messages before initialization', async () => {
      const fresh = new SessionRecorderWorker();
      const freshMessages: WorkerResponse[] = [];
      const freshListener = (event: MessageEvent<WorkerResponse>) => {
        freshMessages.push(event.data);
      };
      fresh.addEventListener('message', freshListener);

      try {
        fresh.postMessage({ type: 'START_SESSION' });
        fresh.postMessage({ type: 'SWITCH_TIMER', payload: { timer: 'Secondary' } });
        fresh.postMessage({ type: 'PROCESS_KEY', payload: { keyName: 'A', keyCode: 65 } });
        fresh.postMessage({ type: 'DELETE_LAST_KEY' });

        // Give the uninitialized worker time to process; asserting absence needs a fixed window
        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(freshMessages).toEqual([]);
      } finally {
        fresh.removeEventListener('message', freshListener);
        fresh.terminate();
      }
    });

    it('should handle rapid message sequences in order', async () => {
      const from = mark();
      send(initMessage('extreme'));
      send({ type: 'START_SESSION' });
      send({ type: 'PROCESS_KEY', payload: { keyName: 'A', keyCode: 65 } });
      send({ type: 'PROCESS_KEY', payload: { keyName: 'B', keyCode: 66 } });
      send({ type: 'SWITCH_TIMER', payload: { timer: 'Secondary' } });
      send({ type: 'DELETE_LAST_KEY' });
      send({ type: 'STOP_SESSION', payload: { reason: 'Completed' } });

      const ended = await nextOf('SESSION_ENDED', from);
      const sliced = received.slice(from);

      expect(ended.payload?.reason).toBe('Completed');
      const systemEvents = sliced.filter((msg) => msg.type === 'SYSTEM_EVENT');
      expect(systemEvents).toHaveLength(2);
      expect(systemEvents[1].payload?.activeTimer).toBe('Secondary');
      expect(sliced.filter((msg) => msg.type === 'KEY_PROCESSED')).toHaveLength(2);
      expect(sliced.filter((msg) => msg.type === 'KEY_DELETED')).toHaveLength(1);
    });
  });

  describe('Performance and Timing', () => {
    it('should send timer updates with the precise polling setting', async () => {
      send(initMessage('precise'));
      await startSession();
      const from = mark();

      const update = await vi.waitFor(() => {
        const found = received
          .slice(from)
          .find((msg) => msg.type === 'TIMER_UPDATE' || msg.type === 'HIGH_FREQ_UPDATE');
        expect(found).toBeDefined();
        return found as WorkerResponse;
      }, WAIT_OPTIONS);

      expect(typeof update.payload?.total).toBe('number');
    });

    it('should complete a full start and completion lifecycle', async () => {
      await startSession();
      const from = mark();
      send({ type: 'STOP_SESSION', payload: { reason: 'Completed' } });

      const ended = await nextOf('SESSION_ENDED', from);
      expect(ended.payload?.reason).toBe('Completed');
    });
  });

  describe('MessageChannel Integration', () => {
    let channel: MessageChannel;
    let channelMessages: WorkerResponse[];

    beforeEach(async () => {
      channel = new MessageChannel();
      channelMessages = [];
      channel.port1.onmessage = (event: MessageEvent<WorkerResponse>) => {
        channelMessages.push(event.data);
      };

      send({ type: 'SETUP_CHANNEL', ports: [channel.port2] }, [channel.port2]);
      send(initMessage());
      await startSession();
    });

    afterEach(() => {
      channel.port1.close();
    });

    it('should send high-frequency updates over the channel instead of postMessage', async () => {
      await vi.waitFor(() => {
        expect(channelMessages.some((msg) => msg.type === 'HIGH_FREQ_UPDATE')).toBe(true);
      }, WAIT_OPTIONS);

      const update = channelMessages.find((msg) => msg.type === 'HIGH_FREQ_UPDATE');
      expect(typeof update?.payload?.total).toBe('number');
      expect(received.some((msg) => msg.type === 'TIMER_UPDATE')).toBe(false);
    });

    it('should keep the channel when SETUP_CHANNEL arrives without ports', async () => {
      send({ type: 'SETUP_CHANNEL' });
      await vi.waitFor(() => {
        expect(channelMessages.some((msg) => msg.type === 'HIGH_FREQ_UPDATE')).toBe(true);
      }, WAIT_OPTIONS);
    });
  });
});
