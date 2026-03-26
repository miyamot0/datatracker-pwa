import { describe, it, expect, beforeEach } from 'vitest';
import { SessionRecorderCore, getHighResTime, formatTimestamp } from '../timing/helpers/session-recorder-core';
import { SavedSettings } from '@/lib/dtos';
import { KeySet } from '@/types/keyset';

describe('SessionRecorderCore', () => {
  let core: SessionRecorderCore;
  let mockSettings: SavedSettings;
  let mockKeyset: KeySet;

  beforeEach(() => {
    core = new SessionRecorderCore();

    mockSettings = {
      DurationS: 10, // 10 second session
      TimerOption: 'End on Primary Timer',
      // Add other required properties as needed
    } as SavedSettings;

    mockKeyset = {
      FrequencyKeys: [
        { KeyName: 'A', KeyCode: 65, KeyDescription: 'Letter A' },
        { KeyName: 'B', KeyCode: 66, KeyDescription: 'Letter B' },
      ],
      DurationKeys: [
        { KeyName: '1', KeyCode: 49, KeyDescription: 'Number 1' },
        { KeyName: '2', KeyCode: 50, KeyDescription: 'Number 2' },
      ],
      ScorableDurationKeys: [
        { KeyName: '1', KeyCode: 49, KeyDescription: 'Number 1' },
        { KeyName: '2', KeyCode: 50, KeyDescription: 'Number 2' },
      ],
    } as KeySet;
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const initialState = core.getState();

      expect(initialState.secondsElapsedTotal).toBe(0);
      expect(initialState.secondsElapsedFirst).toBe(0);
      expect(initialState.secondsElapsedSecond).toBe(0);
      expect(initialState.secondsElapsedThird).toBe(0);
      expect(initialState.secondsElapsedActive).toBe(0);
      expect(initialState.activeTimer).toBe('Stopped');
      expect(initialState.startTime).toBeNull();
      expect(initialState.isRunning).toBe(false);
    });

    it('should initialize with settings and keyset', () => {
      core.init(mockSettings, mockKeyset, 'normal');

      const state = core.getState();
      expect(state.activeTimer).toBe('Stopped');
      expect(core.getUiUpdateInterval()).toBe(50); // 'normal' polling interval
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      core.init(mockSettings, mockKeyset, 'normal');
    });

    it('should start a session successfully', () => {
      const result = core.startSession();

      expect(result).toBeTruthy();
      expect(result?.systemEvents).toHaveLength(2); // Session start + Primary timer start
      expect(core.getState().isRunning).toBe(true);
      expect(core.getState().activeTimer).toBe('Primary');
      expect(core.getSystemKeysPressed()).toHaveLength(2);
    });

    it('should not allow starting multiple sessions', () => {
      core.startSession();
      const secondStart = core.startSession();

      expect(secondStart).toBeNull();
    });

    it('should end a session with correct data', () => {
      core.startSession();
      const result = core.endSession('Completed');

      expect(result.reason).toBe('Completed');
      expect(result.systemKeysPressed).toHaveLength(4); // Start session, start primary, end primary, end session
      expect(result.timers.total).toBeGreaterThanOrEqual(0);
      expect(core.getState().isRunning).toBe(false);
    });
  });

  describe('Timer Management', () => {
    beforeEach(() => {
      core.init(mockSettings, mockKeyset, 'normal');
      core.startSession();
    });

    it('should update timers correctly', () => {
      const { shouldEnd, timerUpdate } = core.updateTimers();

      expect(shouldEnd).toBe(false); // Should not end immediately
      expect(timerUpdate).toBeTruthy();
      expect(timerUpdate?.total).toBeGreaterThan(0);
      expect(timerUpdate?.first).toBeGreaterThan(0);
      expect(timerUpdate?.activeTimer).toBe('Primary');
    });

    it('should switch timers correctly', () => {
      const systemEvents = core.switchTimer('Secondary');

      expect(systemEvents).toHaveLength(2); // End Primary, Start Secondary
      expect(core.getState().activeTimer).toBe('Secondary');
      expect(core.getState().secondsElapsedActive).toBe(0); // Should reset active timer
    });

    it('should not switch to same timer', () => {
      const systemEvents = core.switchTimer('Primary'); // Already on Primary

      expect(systemEvents).toBeNull();
    });
  });

  describe('Key Processing', () => {
    beforeEach(() => {
      core.init(mockSettings, mockKeyset, 'normal');
      core.startSession();
    });

    it('should process frequency keys correctly', () => {
      const result = core.processKey('A', 65);

      expect(result).toBeTruthy();
      expect(result?.key.KeyName).toBe('A');
      expect(result?.key.KeyType).toBe('Frequency');
      expect(result?.totalKeys).toBe(1);
      expect(core.getKeysPressed()).toHaveLength(1);
    });

    it('should process duration keys correctly', () => {
      const result = core.processKey('1', 49);

      expect(result).toBeTruthy();
      expect(result?.key.KeyName).toBe('1');
      expect(result?.key.KeyType).toBe('Duration');
    });

    it('should ignore unknown keys', () => {
      const result = core.processKey('Z', 90); // Not in keyset

      expect(result).toBeNull();
      expect(core.getKeysPressed()).toHaveLength(0);
    });

    it('should delete last key correctly', () => {
      core.processKey('A', 65);
      core.processKey('B', 66);
      expect(core.getKeysPressed()).toHaveLength(2);

      const result = core.deleteLastKey();

      expect(result).toBeTruthy();
      expect(result?.deletedKey.KeyName).toBe('B');
      expect(result?.totalKeys).toBe(1);
      expect(core.getKeysPressed()).toHaveLength(1);
    });

    it('should handle deleting from empty keys list', () => {
      const result = core.deleteLastKey();

      expect(result).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    it('should get timer constants', () => {
      const constants = SessionRecorderCore.getTimerConstants();

      expect(constants.TIME_DELTA).toBe(10);
      expect(constants.TIME_UNIT).toBe(1000);
      expect(constants.INCREMENT).toBe(0.01);
    });

    it('should get high resolution time', () => {
      const time1 = getHighResTime();
      const time2 = getHighResTime();

      expect(time2).toBeGreaterThanOrEqual(time1);
    });

    it('should format timestamp correctly', () => {
      const perfTime = performance.now();
      const formatted = formatTimestamp(perfTime);

      expect(formatted).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });
  });

  describe('State Access', () => {
    it('should provide immutable state access', () => {
      const state1 = core.getState();
      const state2 = core.getState();

      // Should be different objects (defensive copy)
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });

    it('should provide immutable keys access', () => {
      core.init(mockSettings, mockKeyset, 'normal');
      core.startSession();
      core.processKey('A', 65);

      const keys1 = core.getKeysPressed();
      const keys2 = core.getKeysPressed();

      expect(keys1).not.toBe(keys2); // Different arrays
      expect(keys1).toEqual(keys2); // Same content
    });
  });
});
