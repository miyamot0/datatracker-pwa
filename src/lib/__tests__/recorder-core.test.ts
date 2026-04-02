import { describe, it, expect, beforeEach } from 'vitest';
import { SessionRecorderCore, getHighResTime, formatTimestamp } from '../recorder-core';
import { SavedSettings } from '@/lib/dtos/session-settings';
import { KeySet } from '@/types/keyset/core';

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

    it('should set course polling interval', () => {
      core.init(mockSettings, mockKeyset, 'course');
      expect(core.getUiUpdateInterval()).toBe(100);
    });

    it('should set precise polling interval', () => {
      core.init(mockSettings, mockKeyset, 'precise');
      expect(core.getUiUpdateInterval()).toBe(25);
    });

    it('should set extreme polling interval', () => {
      core.init(mockSettings, mockKeyset, 'extreme');
      expect(core.getUiUpdateInterval()).toBe(10);
    });

    it('should initialize special key timers when keyset has SpecialDurationKeys', () => {
      const keysetWithSpecial: KeySet = {
        ...mockKeyset,
        SpecialDurationKeys: [
          { KeyName: 'SpecialA', KeyCode: 300, KeyDescription: 'Special A' },
          { KeyName: 'SpecialB', KeyCode: 301, KeyDescription: 'Special B' },
        ],
      };
      core.init(mockSettings, keysetWithSpecial, 'normal');

      const state = core.getState();
      expect(state.specialKeyTimers.has('SpecialA')).toBe(true);
      expect(state.specialKeyTimers.has('SpecialB')).toBe(true);
      expect(state.specialKeyTimers.get('SpecialA')).toBe(0);
    });

    it('should return null from startSession when not initialized', () => {
      const uninitCore = new SessionRecorderCore();
      const result = uninitCore.startSession();
      expect(result).toBeNull();
    });

    it('should return false shouldEnd from updateTimers when not initialized', () => {
      const uninitCore = new SessionRecorderCore();
      const result = uninitCore.updateTimers();
      expect(result.shouldEnd).toBe(false);
      expect(result.timerUpdate).toBeUndefined();
    });

    it('should reset state when init is called again', () => {
      core.init(mockSettings, mockKeyset, 'normal');
      core.startSession();
      expect(core.getState().isRunning).toBe(true);

      core.init(mockSettings, mockKeyset, 'normal');
      expect(core.getState().isRunning).toBe(false);
      expect(core.getState().secondsElapsedTotal).toBe(0);
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

    it('should end a session with Cancelled reason', () => {
      core.startSession();
      const result = core.endSession('Cancelled');

      expect(result.reason).toBe('Cancelled');
      expect(core.getState().isRunning).toBe(false);
    });

    it('should include keys pressed in end session result', () => {
      core.startSession();
      core.processKey('A', 65);
      core.processKey('B', 66);
      const result = core.endSession('Completed');

      expect(result.keysPressed).toHaveLength(2);
    });

    it('should include startTime as formatted string in end result', () => {
      core.startSession();
      const result = core.endSession('Completed');

      expect(result.startTime).not.toBeNull();
      expect(result.startTime).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });

    it('should auto-close odd duration intervals before session end', () => {
      core.startSession();

      // Single duration press means an open interval that must be closed at end.
      core.processKey('1', 49);

      const result = core.endSession('Completed');
      const durationEvents = result.keysPressed.filter((k) => k.KeyType === 'Duration' && k.KeyCode === 49);

      expect(durationEvents).toHaveLength(2);
      expect(durationEvents[1].TimeIntoSession).toBeGreaterThanOrEqual(durationEvents[0].TimeIntoSession);
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

    it('should return false shouldEnd when not running', () => {
      core.endSession('Completed');
      const result = core.updateTimers();
      expect(result.shouldEnd).toBe(false);
      expect(result.timerUpdate).toBeUndefined();
    });

    it('should increment secondary timer when Secondary is active', () => {
      core.switchTimer('Secondary');
      const { timerUpdate } = core.updateTimers();

      expect(timerUpdate?.second).toBeGreaterThan(0);
      expect(timerUpdate?.first).toBe(0);
      expect(timerUpdate?.activeTimer).toBe('Secondary');
    });

    it('should increment tertiary timer when Tertiary is active', () => {
      core.switchTimer('Tertiary');
      const { timerUpdate } = core.updateTimers();

      expect(timerUpdate?.third).toBeGreaterThan(0);
      expect(timerUpdate?.first).toBe(0);
      expect(timerUpdate?.second).toBe(0);
    });

    it('should switch timers correctly', () => {
      const systemEvents = core.switchTimer('Secondary');

      expect(systemEvents).toHaveLength(2); // End Primary, Start Secondary
      expect(core.getState().activeTimer).toBe('Secondary');
      expect(core.getState().secondsElapsedActive).toBe(0); // Should reset active timer
    });

    it('should switch to Tertiary timer', () => {
      const systemEvents = core.switchTimer('Tertiary');

      expect(systemEvents).toHaveLength(2);
      expect(core.getState().activeTimer).toBe('Tertiary');
      expect(core.getState().secondsElapsedActive).toBe(0);
    });

    it('should not switch to same timer', () => {
      const systemEvents = core.switchTimer('Primary'); // Already on Primary

      expect(systemEvents).toBeNull();
    });

    it('should return null from switchTimer when not running', () => {
      core.endSession('Completed');
      const freshCore = new SessionRecorderCore();
      freshCore.init(mockSettings, mockKeyset, 'normal');
      const result = freshCore.switchTimer('Secondary');
      expect(result).toBeNull();
    });

    it('should end session when End on Primary Timer duration is exceeded', () => {
      const endSettings = { DurationS: 1, TimerOption: 'End on Primary Timer' } as SavedSettings;
      core.init(endSettings, mockKeyset, 'normal');
      core.startSession();

      let shouldEnd = false;
      for (let i = 0; i < 150; i++) {
        const result = core.updateTimers();
        shouldEnd = result.shouldEnd;
        if (shouldEnd) break;
      }
      expect(shouldEnd).toBe(true);
    });

    it('should end session with End on Timer #1 when Primary is active', () => {
      const endSettings = { DurationS: 1, TimerOption: 'End on Timer #1' } as SavedSettings;
      core.init(endSettings, mockKeyset, 'normal');
      core.startSession(); // starts on Primary

      let shouldEnd = false;
      let timerUpdate;
      for (let i = 0; i < 150; i++) {
        const result = core.updateTimers();
        shouldEnd = result.shouldEnd;
        timerUpdate = result.timerUpdate;
        if (shouldEnd) break;
      }

      expect(shouldEnd).toBe(true);
      // timerUpdate.first should be floored
      expect(timerUpdate?.first).toBe(Math.floor(timerUpdate!.first));
    });

    it('should not end session with End on Timer #1 when Secondary is active', () => {
      const endSettings = { DurationS: 0, TimerOption: 'End on Timer #1' } as SavedSettings;
      core.init(endSettings, mockKeyset, 'normal');
      core.startSession();
      core.switchTimer('Secondary');

      // With DurationS=0 and 'End on Timer #1', should not trigger since active timer is Secondary
      core.updateTimers();
      const { shouldEnd } = core.updateTimers();
      expect(shouldEnd).toBe(false);
    });

    it('should end session with End on Timer #2 when Secondary is active', () => {
      const endSettings = { DurationS: 1, TimerOption: 'End on Timer #2' } as SavedSettings;
      core.init(endSettings, mockKeyset, 'normal');
      core.startSession();
      core.switchTimer('Secondary');

      let shouldEnd = false;
      let timerUpdate;
      for (let i = 0; i < 150; i++) {
        const result = core.updateTimers();
        shouldEnd = result.shouldEnd;
        timerUpdate = result.timerUpdate;
        if (shouldEnd) break;
      }

      expect(shouldEnd).toBe(true);
      expect(timerUpdate?.second).toBe(Math.floor(timerUpdate!.second));
    });

    it('should end session with End on Timer #3 when Tertiary is active', () => {
      const endSettings = { DurationS: 1, TimerOption: 'End on Timer #3' } as SavedSettings;
      core.init(endSettings, mockKeyset, 'normal');
      core.startSession();
      core.switchTimer('Tertiary');

      let shouldEnd = false;
      let timerUpdate;
      for (let i = 0; i < 150; i++) {
        const result = core.updateTimers();
        shouldEnd = result.shouldEnd;
        timerUpdate = result.timerUpdate;
        if (shouldEnd) break;
      }

      expect(shouldEnd).toBe(true);
      expect(timerUpdate?.third).toBe(Math.floor(timerUpdate!.third));
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

    it('should return null from processKey when not running', () => {
      core.endSession('Completed');
      const freshCore = new SessionRecorderCore();
      freshCore.init(mockSettings, mockKeyset, 'normal');

      const result = freshCore.processKey('A', 65);
      expect(result).toBeNull();
    });

    it('should process keys found only in ScorableDurationKeys', () => {
      const keysetScorableOnly: KeySet = {
        ...mockKeyset,
        DurationKeys: [],
        ScorableDurationKeys: [{ KeyName: 'ScorableOnly', KeyCode: 200, KeyDescription: 'Scorable Only Key' }],
      };
      core.init(mockSettings, keysetScorableOnly, 'normal');
      core.startSession();

      const result = core.processKey('ScorableOnly', 200);
      expect(result).toBeTruthy();
      expect(result?.key.KeyName).toBe('ScorableOnly');
      expect(result?.key.KeyType).toBe('Duration');
    });

    it('should record KeyScheduleRecording from active timer', () => {
      core.switchTimer('Secondary');
      const result = core.processKey('A', 65);

      expect(result?.key.KeyScheduleRecording).toBe('Secondary');
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

  describe('Special Key Management', () => {
    let mockKeysetWithSpecial: KeySet;

    beforeEach(() => {
      mockKeysetWithSpecial = {
        ...mockKeyset,
        SpecialDurationKeys: [{ KeyName: 'SpecialTimer', KeyCode: 999, KeyDescription: 'Special Timer Key' }],
      };
      core.init(mockSettings, mockKeysetWithSpecial, 'normal');
    });

    it('should switch to a special key timer', () => {
      core.startSession();
      const systemEvents = core.switchToSpecialKey('SpecialTimer');

      expect(systemEvents).toHaveLength(2);
      expect(core.getState().activeSpecialKey).toBe('SpecialTimer');
      expect(core.getState().activeTimer).toBe('Special');
    });

    it('should return null from switchToSpecialKey when not running', () => {
      const result = core.switchToSpecialKey('SpecialTimer');
      expect(result).toBeNull();
    });

    it('should return null when switching to a non-existent special key', () => {
      core.startSession();
      const result = core.switchToSpecialKey('NonExistent');
      expect(result).toBeNull();
    });

    it('should return null when already on the active special key', () => {
      core.startSession();
      core.switchToSpecialKey('SpecialTimer');
      const result = core.switchToSpecialKey('SpecialTimer');
      expect(result).toBeNull();
    });

    it('should increment special key timer when special key is active', () => {
      core.startSession();
      core.switchToSpecialKey('SpecialTimer');

      const { timerUpdate } = core.updateTimers();
      const specialTimerValue = timerUpdate?.specialKeyTimers['SpecialTimer'] ?? 0;

      expect(specialTimerValue).toBeGreaterThan(0);
      // Standard first timer should NOT increment after switching to special key
      expect(timerUpdate?.first).toBe(0);
    });

    it('should switch from special key back to standard timer', () => {
      core.startSession();
      core.switchToSpecialKey('SpecialTimer');
      expect(core.getState().activeSpecialKey).toBe('SpecialTimer');

      const systemEvents = core.switchTimer('Primary');
      expect(systemEvents).toHaveLength(2);
      expect(core.getState().activeSpecialKey).toBeNull();
      expect(core.getState().activeTimer).toBe('Primary');
    });

    it('should end session while special key is active and include correct system events', () => {
      core.startSession();
      core.switchToSpecialKey('SpecialTimer');

      const result = core.endSession('Completed');
      // Start session, start primary, end primary, start special, end special, end session
      expect(result.systemKeysPressed).toHaveLength(6);
    });

    it('should end session when special key duration is exceeded', () => {
      const specialKeyCode = 999;
      const endSettings = { DurationS: 1, TimerOption: specialKeyCode } as unknown as SavedSettings;
      core.init(endSettings, mockKeysetWithSpecial, 'normal');
      core.startSession();
      core.switchToSpecialKey('SpecialTimer');

      let shouldEnd = false;
      for (let i = 0; i < 150; i++) {
        const result = core.updateTimers();
        shouldEnd = result.shouldEnd;
        if (shouldEnd) break;
      }

      expect(shouldEnd).toBe(true);
    });

    it('should detect special key end condition even when special key is not active', () => {
      const specialKeyCode = 999;
      // With DurationS=-1, the initial 0 seconds exceeds -1 even without activating
      const endSettings = { DurationS: -1, TimerOption: specialKeyCode } as unknown as SavedSettings;
      core.init(endSettings, mockKeysetWithSpecial, 'normal');
      core.startSession();
      // Do NOT switch to special key - stay on Primary
      // The special key timer is at 0, 0 > -1 is true

      const { shouldEnd } = core.updateTimers();
      expect(shouldEnd).toBe(true);
    });

    it('should return false when numeric TimerOption does not match any SpecialDurationKey', () => {
      const unknownKeyCode = 12345; // does not match KeyCode 999
      const endSettings = { DurationS: 10, TimerOption: unknownKeyCode } as unknown as SavedSettings;
      core.init(endSettings, mockKeysetWithSpecial, 'normal');
      core.startSession();

      // shouldEnd should be false since key is not found; console.error path is hit
      const { shouldEnd } = core.updateTimers();
      expect(shouldEnd).toBe(false);
    });
  });
});
