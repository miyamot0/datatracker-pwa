import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SavedSessionResult } from '../dtos';
import { KeySet, KeySetInstance, ExpandedKeySetInstance } from '@/types/keyset';
import { ModifiedSessionResult } from '@/types/storage';
import { ToggleDisplayKey } from '@/types/visuals';

// Mock the helper functions from schedule_parser
vi.mock('@/lib/schedule-parser', () => ({
  walkSessionFrequencyKey: vi.fn(),
  walkSessionDurationKey: vi.fn(),
}));

// Mock colors and shapes
vi.mock('@/lib/colors', () => ({
  FIGURE_PATH_COLORS: ['#9061C2', '#4E9CB5', '#4BC599', '#F9A826', '#EB540A', '#C86F98', '#14B694'],
}));

vi.mock('@/lib/shapes', () => ({
  getShape: vi.fn((index) => {
    const shapes = ['circle', 'cross', 'diamond', 'square', 'star', 'triangle', 'wye'];
    return shapes[index % 7];
  }),
}));

import {
  filterSessionsByPrimaryRole,
  filterSessionsByReliabilityRole,
  getUniqueSessionConditions,
  generateTicks,
  generateChartPreparation,
  extractAndDeduplicateKeysets,
  mapKeysWithStoragePreference,
  calculateSplitPoints,
  createChartLegends,
  getChartConfiguration,
  createNavigationHandler,
} from '../graphing';

// Import the mocked functions for use in tests
import { walkSessionFrequencyKey, walkSessionDurationKey } from '@/lib/schedule-parser';
import { SessionTerminationOptionsType } from '@/types/terminations';
import { getShape } from '@/lib/shapes';

describe('graphing utility functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to create mock KeySet
  const createMockKeySet = (frequencyKeys: KeySetInstance[] = [], durationKeys: KeySetInstance[] = []): KeySet => ({
    id: 'test-keyset-1',
    Name: 'Test KeySet',
    DerivedKeys: [],
    FrequencyKeys: frequencyKeys,
    DurationKeys: durationKeys,
    createdAt: new Date('2024-01-01'),
    lastModified: new Date('2024-01-01'),
    SpecialDurationKeys: [],
  });

  // Helper function to create mock SavedSessionResult
  const createMockSession = (
    session: number,
    role: 'Primary' | 'Reliability' = 'Primary',
    condition: string = 'Baseline',
    keyset: KeySet = createMockKeySet(),
  ): SavedSessionResult => ({
    Keyset: keyset,
    SessionSettings: {
      Therapist: 'Test Therapist',
      Condition: condition,
      KeySet: 'test-keyset',
      TimerOption: 'End on Timer #1',
      Initials: 'TT',
      Role: role,
      Session: session,
      DurationS: 600,
    },
    SystemKeyPresses: [],
    FrequencyKeyPresses: [],
    DurationKeyPresses: [],
    SessionStart: '2024-01-01T10:00:00Z',
    SessionEnd: '2024-01-01T10:10:00Z',
    EndedEarly: false,
    TimerMain: 600,
    TimerOne: 300,
    TimerTwo: 450,
    TimerThree: 500,
    SpecialKeyTimers: {},
  });

  describe('filterSessionsByPrimaryRole', () => {
    it('should filter sessions to only include primary role', () => {
      const sessions = [
        createMockSession(1, 'Primary'),
        createMockSession(2, 'Reliability'),
        createMockSession(3, 'Primary'),
        createMockSession(4, 'Reliability'),
      ];

      const result = filterSessionsByPrimaryRole(sessions);

      expect(result).toHaveLength(2);
      expect(result[0].SessionSettings.Role).toBe('Primary');
      expect(result[1].SessionSettings.Role).toBe('Primary');
    });

    it('should sort filtered sessions by session number', () => {
      const sessions = [
        createMockSession(3, 'Primary'),
        createMockSession(1, 'Primary'),
        createMockSession(5, 'Primary'),
        createMockSession(2, 'Reliability'),
      ];

      const result = filterSessionsByPrimaryRole(sessions);

      expect(result).toHaveLength(3);
      expect(result[0].SessionSettings.Session).toBe(1);
      expect(result[1].SessionSettings.Session).toBe(3);
      expect(result[2].SessionSettings.Session).toBe(5);
    });

    it('should return empty array when no primary sessions exist', () => {
      const sessions = [createMockSession(1, 'Reliability'), createMockSession(2, 'Reliability')];

      const result = filterSessionsByPrimaryRole(sessions);

      expect(result).toHaveLength(0);
    });

    it('should handle empty input array', () => {
      const result = filterSessionsByPrimaryRole([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getUniqueSessionConditions', () => {
    it('should return unique conditions from sessions', () => {
      const sessions = [
        createMockSession(1, 'Primary', 'Baseline'),
        createMockSession(2, 'Primary', 'Treatment'),
        createMockSession(3, 'Primary', 'Baseline'),
        createMockSession(4, 'Primary', 'Maintenance'),
        createMockSession(5, 'Primary', 'Treatment'),
      ];

      const result = getUniqueSessionConditions(sessions);

      expect(result).toEqual(['Baseline', 'Treatment', 'Maintenance']);
    });

    it('should handle sessions with same conditions', () => {
      const sessions = [
        createMockSession(1, 'Primary', 'Baseline'),
        createMockSession(2, 'Primary', 'Baseline'),
        createMockSession(3, 'Primary', 'Baseline'),
      ];

      const result = getUniqueSessionConditions(sessions);

      expect(result).toEqual(['Baseline']);
    });

    it('should handle empty input array', () => {
      const result = getUniqueSessionConditions([]);
      expect(result).toEqual([]);
    });

    it('should handle sessions with empty string conditions', () => {
      const sessions = [
        createMockSession(1, 'Primary', ''),
        createMockSession(2, 'Primary', 'Treatment'),
        createMockSession(3, 'Primary', ''),
      ];

      const result = getUniqueSessionConditions(sessions);

      expect(result).toEqual(['', 'Treatment']);
    });
  });

  describe('generateTicks', () => {
    it('should generate correct tick array for positive range', () => {
      const result = generateTicks(5, 1);
      expect(result).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should generate correct tick array starting from 0', () => {
      const result = generateTicks(3, 0);
      expect(result).toEqual([0, 1, 2, 3]);
    });

    it('should handle single tick', () => {
      const result = generateTicks(0, 5);
      expect(result).toEqual([5]);
    });

    it('should handle negative starting values', () => {
      const result = generateTicks(2, -2);
      expect(result).toEqual([-2, -1, 0]);
    });

    it('should handle when maxTick equals minTick', () => {
      const result = generateTicks(0, 10);
      expect(result).toEqual([10]);
    });

    it('should handle large ranges', () => {
      const result = generateTicks(2, 98);
      expect(result).toEqual([98, 99, 100]);
    });
  });

  describe('generateChartPreparation', () => {
    const mockFrequencyKey: KeySetInstance = {
      KeyName: 'FreqKey1',
      KeyDescription: 'Frequency Key 1',
      KeyCode: 65,
    };

    const mockDurationKey: KeySetInstance = {
      KeyName: 'DurKey1',
      KeyDescription: 'Duration Key 1',
      KeyCode: 66,
    };

    beforeEach(() => {
      // Setup default mock returns
      (walkSessionFrequencyKey as any).mockReturnValue({
        KeyName: 'FreqKey1',
        KeyDescription: 'Frequency Key 1',
        Schedule: 'Primary',
        Value: 10,
        Bouts: -1,
      });

      (walkSessionDurationKey as any).mockReturnValue({
        KeyName: 'DurKey1',
        KeyDescription: 'Duration Key 1',
        Schedule: 'Primary',
        Value: 30.5,
        Bouts: 2,
      });
    });

    it('should process frequency perspective with End on Timer #1', () => {
      const keyset = createMockKeySet([mockFrequencyKey], []);
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      const result = generateChartPreparation(sessions, 'End on Timer #1', 'Frequency');

      expect(result).toHaveLength(1);
      expect(result[0].Session).toBe(1);
      expect(result[0].Schedule).toBe('End on Timer #1');
      expect(result[0].SessionTime).toBe(300); // TimerOne
      expect(result[0].Scores).toHaveLength(1);

      // Verify walkSessionFrequencyKey was called with correct parameters
      expect(walkSessionFrequencyKey).toHaveBeenCalledWith(
        sessions[0],
        'Primary', // converted schedule
        mockFrequencyKey,
      );
    });

    it('should process duration perspective with End on Timer #2', () => {
      const keyset = createMockKeySet([], [mockDurationKey]);
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      const result = generateChartPreparation(sessions, 'End on Timer #2', 'Duration');

      expect(result).toHaveLength(1);
      expect(result[0].Session).toBe(1);
      expect(result[0].Schedule).toBe('End on Timer #2');
      expect(result[0].SessionTime).toBe(450); // TimerTwo
      expect(result[0].Scores).toHaveLength(1);

      // Verify walkSessionDurationKey was called with correct parameters
      expect(walkSessionDurationKey).toHaveBeenCalledWith(
        sessions[0],
        'Secondary', // converted schedule
        mockDurationKey,
      );
    });

    it('should process End on Timer #3', () => {
      const keyset = createMockKeySet([mockFrequencyKey], []);
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      const result = generateChartPreparation(sessions, 'End on Timer #3', 'Frequency');

      expect(result[0].SessionTime).toBe(500); // TimerThree
      expect(walkSessionFrequencyKey).toHaveBeenCalledWith(
        sessions[0],
        'Tertiary', // converted schedule
        mockFrequencyKey,
      );
    });

    it('should throw error for End on Primary Timer due to convertScheduleSetting', () => {
      const keyset = createMockKeySet([mockFrequencyKey], []);
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      expect(() => {
        generateChartPreparation(sessions, 'End on Primary Timer', 'Frequency');
      }).toThrow('Invalid Schedule Option');
    });

    it('should throw error for invalid schedule option in pullSessionTime', () => {
      const keyset = createMockKeySet([mockFrequencyKey], []);
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      expect(() => {
        generateChartPreparation(sessions, 'Invalid Schedule' as SessionTerminationOptionsType, 'Frequency');
      }).toThrow('Invalid Schedule Option');
    });

    it('should process End on Primary Timer when no keys to process', () => {
      // This test verifies that 'End on Primary Timer' works for pullSessionTime
      // but fails in convertScheduleSetting only when there are keys to process
      const keyset = createMockKeySet([], []); // empty keyset avoids convertScheduleSetting call
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      const result = generateChartPreparation(sessions, 'End on Primary Timer', 'Frequency');

      expect(result[0].SessionTime).toBe(600); // TimerMain
      expect(result[0].Scores).toEqual([]);
    });

    it('should handle multiple sessions', () => {
      const keyset = createMockKeySet([mockFrequencyKey], []);
      const sessions = [
        createMockSession(1, 'Primary', 'Baseline', keyset),
        createMockSession(2, 'Primary', 'Treatment', keyset),
      ];

      const result = generateChartPreparation(sessions, 'End on Timer #1', 'Frequency');

      expect(result).toHaveLength(2);
      expect(result[0].Session).toBe(1);
      expect(result[0].Condition).toBe('Baseline');
      expect(result[1].Session).toBe(2);
      expect(result[1].Condition).toBe('Treatment');
    });

    it('should handle multiple keys in frequency perspective', () => {
      const keyset = createMockKeySet([mockFrequencyKey, mockFrequencyKey], []);
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      (walkSessionFrequencyKey as any)
        .mockReturnValueOnce({ KeyName: 'FreqKey1', Value: 10 })
        .mockReturnValueOnce({ KeyName: 'FreqKey2', Value: 20 });

      const result = generateChartPreparation(sessions, 'End on Timer #1', 'Frequency');

      expect(result[0].Scores).toHaveLength(2);
      expect(walkSessionFrequencyKey).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple keys in duration perspective', () => {
      const keyset = createMockKeySet([], [mockDurationKey, mockDurationKey]);
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      (walkSessionDurationKey as any)
        .mockReturnValueOnce({ KeyName: 'DurKey1', Value: 30.5 })
        .mockReturnValueOnce({ KeyName: 'DurKey2', Value: 45.2 });

      const result = generateChartPreparation(sessions, 'End on Timer #1', 'Duration');

      expect(result[0].Scores).toHaveLength(2);
      expect(walkSessionDurationKey).toHaveBeenCalledTimes(2);
    });

    it('should throw error for invalid schedule option in convertScheduleSetting', () => {
      const keyset = createMockKeySet([mockFrequencyKey], []);
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      expect(() => {
        generateChartPreparation(sessions, 'Invalid Schedule' as SessionTerminationOptionsType, 'Frequency');
      }).toThrow('Invalid Schedule Option');
    });

    it('should throw error for invalid schedule option in pullSessionTime', () => {
      const keyset = createMockKeySet([mockFrequencyKey], []);
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      expect(() => {
        generateChartPreparation(sessions, 'Invalid Schedule' as SessionTerminationOptionsType, 'Frequency');
      }).toThrow('Invalid Schedule Option');
    });

    it('should include all expected properties in result', () => {
      const keyset = createMockKeySet([mockFrequencyKey], []);
      const session = createMockSession(1, 'Primary', 'Baseline', keyset);
      const sessions = [session];

      const result = generateChartPreparation(sessions, 'End on Timer #1', 'Frequency');

      expect(result[0]).toMatchObject({
        Session: 1,
        SessionSettings: session.SessionSettings,
        Condition: 'Baseline',
        FrequencyKeyPresses: session.FrequencyKeyPresses,
        DurationKeyPresses: session.DurationKeyPresses,
        Schedule: 'End on Timer #1',
        SessionTime: 300,
        Scores: expect.any(Array),
      });
    });

    it('should handle empty keyset gracefully', () => {
      const keyset = createMockKeySet([], []);
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      const result = generateChartPreparation(sessions, 'End on Timer #1', 'Frequency');

      expect(result[0].Scores).toEqual([]);
      expect(walkSessionFrequencyKey).not.toHaveBeenCalled();
    });
  });

  describe('filterSessionsByReliabilityRole', () => {
    it('should filter sessions to only include reliability role', () => {
      const sessions = [
        createMockSession(1, 'Primary'),
        createMockSession(2, 'Reliability'),
        createMockSession(3, 'Primary'),
        createMockSession(4, 'Reliability'),
      ];

      const result = filterSessionsByReliabilityRole(sessions);

      expect(result).toHaveLength(2);
      expect(result[0].SessionSettings.Role).toBe('Reliability');
      expect(result[1].SessionSettings.Role).toBe('Reliability');
    });

    it('should sort filtered sessions by session number', () => {
      const sessions = [
        createMockSession(4, 'Reliability'),
        createMockSession(2, 'Reliability'),
        createMockSession(1, 'Primary'),
        createMockSession(3, 'Reliability'),
      ];

      const result = filterSessionsByReliabilityRole(sessions);

      expect(result).toHaveLength(3);
      expect(result[0].SessionSettings.Session).toBe(2);
      expect(result[1].SessionSettings.Session).toBe(3);
      expect(result[2].SessionSettings.Session).toBe(4);
    });

    it('should return empty array when no reliability sessions exist', () => {
      const sessions = [createMockSession(1, 'Primary'), createMockSession(2, 'Primary')];

      const result = filterSessionsByReliabilityRole(sessions);

      expect(result).toHaveLength(0);
    });

    it('should handle empty input array', () => {
      const result = filterSessionsByReliabilityRole([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('extractAndDeduplicateKeysets', () => {
    const createMockModifiedSession = (
      session: number,
      frequencyKeys: KeySetInstance[] = [],
      durationKeys: KeySetInstance[] = [],
      filename = `session${session}.json`,
    ): ModifiedSessionResult => ({
      ...createMockSession(session),
      Keyset: createMockKeySet(frequencyKeys, durationKeys),
      Filename: filename,
    });

    it('should deduplicate frequency keys across multiple sessions', () => {
      const key1: KeySetInstance = { KeyName: 'Key1', KeyDescription: 'Key 1', KeyCode: 65 };
      const key2: KeySetInstance = { KeyName: 'Key2', KeyDescription: 'Key 2', KeyCode: 66 };
      const key1Duplicate: KeySetInstance = { KeyName: 'Key1', KeyDescription: 'Key 1', KeyCode: 65 };

      const keyset = createMockKeySet([key1, key2], []);

      const sessions = [
        createMockModifiedSession(1, [key1, key2]),
        createMockModifiedSession(2, [key1Duplicate]),
        createMockModifiedSession(3, [key2]),
      ];

      const result = extractAndDeduplicateKeysets(sessions, keyset);

      expect(result.frequencyKeys).toHaveLength(2);
      expect(result.frequencyKeys).toEqual([key1, key2]);
    });

    it('should deduplicate duration keys across multiple sessions', () => {
      const key1: KeySetInstance = { KeyName: 'DurKey1', KeyDescription: 'Duration Key 1', KeyCode: 67 };
      const key2: KeySetInstance = { KeyName: 'DurKey2', KeyDescription: 'Duration Key 2', KeyCode: 68 };
      const key1Duplicate: KeySetInstance = { KeyName: 'DurKey1', KeyDescription: 'Duration Key 1', KeyCode: 67 };

      const sessions = [
        createMockModifiedSession(1, [], [key1, key2]),
        createMockModifiedSession(2, [], [key1Duplicate]),
        createMockModifiedSession(3, [], [key2]),
      ];

      const keyset = createMockKeySet([], [key1, key2]);
      const result = extractAndDeduplicateKeysets(sessions, keyset);

      expect(result.durationKeys).toHaveLength(2);
      expect(result.durationKeys).toEqual([key1, key2]);
    });

    it('should handle sessions with no keys', () => {
      const sessions = [createMockModifiedSession(1, [], []), createMockModifiedSession(2, [], [])];

      const keyset = createMockKeySet([], []);
      const result = extractAndDeduplicateKeysets(sessions, keyset);

      expect(result.frequencyKeys).toHaveLength(0);
      expect(result.durationKeys).toHaveLength(0);
    });

    it('should handle empty input array', () => {
      const keyset = createMockKeySet([], []);
      const result = extractAndDeduplicateKeysets([], keyset);

      expect(result.frequencyKeys).toHaveLength(0);
      expect(result.durationKeys).toHaveLength(0);
    });

    it('should handle mixed frequency and duration keys', () => {
      const freqKey: KeySetInstance = { KeyName: 'FreqKey', KeyDescription: 'Frequency Key', KeyCode: 65 };
      const durKey: KeySetInstance = { KeyName: 'DurKey', KeyDescription: 'Duration Key', KeyCode: 66 };

      const sessions = [
        createMockModifiedSession(1, [freqKey], [durKey]),
        createMockModifiedSession(2, [freqKey], [durKey]),
      ];

      const keyset = createMockKeySet([freqKey], [durKey]);
      const result = extractAndDeduplicateKeysets(sessions, keyset);

      expect(result.frequencyKeys).toHaveLength(1);
      expect(result.durationKeys).toHaveLength(1);
      expect(result.frequencyKeys[0]).toEqual(freqKey);
      expect(result.durationKeys[0]).toEqual(durKey);
    });
  });

  describe('mapKeysWithStoragePreference', () => {
    it('should mark keys as invisible when they are in stored preferences', () => {
      const keys: ToggleDisplayKey[] = [
        { KeyDescription: 'Key1', Visible: true, KeyType: 'Observed', KeyName: 'Key1', KeyCode: 65 },
        { KeyDescription: 'Key2', Visible: true, KeyType: 'Observed', KeyName: 'Key2', KeyCode: 66 },
        { KeyDescription: 'Key3', Visible: true, KeyType: 'Observed', KeyName: 'Key3', KeyCode: 67 },
      ];

      const storedPreferences = {
        KeyDescription: ['Key1', 'Key3'],
        CTBElements: [],
      };

      const result = mapKeysWithStoragePreference(keys, storedPreferences);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        KeyDescription: 'Key1',
        Visible: false,
        KeyType: 'Observed',
        KeyName: 'Key1',
        KeyCode: 65,
      });
      expect(result[1]).toEqual({
        KeyDescription: 'Key2',
        Visible: true,
        KeyType: 'Observed',
        KeyName: 'Key2',
        KeyCode: 66,
      });
      expect(result[2]).toEqual({
        KeyDescription: 'Key3',
        Visible: false,
        KeyType: 'Observed',
        KeyName: 'Key3',
        KeyCode: 67,
      });
    });

    it('should keep keys visible when they are not in stored preferences', () => {
      const keys: ToggleDisplayKey[] = [
        { KeyDescription: 'Key1', Visible: true, KeyType: 'Observed', KeyName: 'Key1', KeyCode: 65 },
        { KeyDescription: 'Key2', Visible: true, KeyType: 'Observed', KeyName: 'Key2', KeyCode: 66 },
      ];

      const storedPreferences = {
        KeyDescription: [],
        CTBElements: [],
      };

      const result = mapKeysWithStoragePreference(keys, storedPreferences);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        KeyDescription: 'Key1',
        Visible: true,
        KeyType: 'Observed',
        KeyName: 'Key1',
        KeyCode: 65,
      });
      expect(result[1]).toEqual({
        KeyDescription: 'Key2',
        Visible: true,
        KeyType: 'Observed',
        KeyName: 'Key2',
        KeyCode: 66,
      });
    });

    it('should handle empty keys array', () => {
      const keys: ToggleDisplayKey[] = [];
      const storedPreferences = {
        KeyDescription: ['Key1'],
        CTBElements: [],
      };

      const result = mapKeysWithStoragePreference(keys, storedPreferences);

      expect(result).toHaveLength(0);
    });

    it('should handle keys that start as invisible', () => {
      const keys: ToggleDisplayKey[] = [
        { KeyDescription: 'Key1', Visible: false, KeyType: 'Observed', KeyName: 'Key1', KeyCode: 65 },
        { KeyDescription: 'Key2', Visible: true, KeyType: 'Observed', KeyName: 'Key2', KeyCode: 66 },
      ];

      const storedPreferences = {
        KeyDescription: ['Key2'],
        CTBElements: [],
      };

      const result = mapKeysWithStoragePreference(keys, storedPreferences);

      expect(result[0]).toEqual({
        KeyDescription: 'Key1',
        Visible: false,
        KeyType: 'Observed',
        KeyName: 'Key1',
        KeyCode: 65,
      });
      expect(result[1]).toEqual({
        KeyDescription: 'Key2',
        Visible: false,
        KeyType: 'Observed',
        KeyName: 'Key2',
        KeyCode: 66,
      });
    });
  });

  describe('calculateSplitPoints', () => {
    it('should calculate split points when there are sessions with different conditions between data points', () => {
      const conditionData = [{ session: 1 }, { session: 5 }, { session: 10 }];

      const filteredSessions = [
        createMockSession(1, 'Primary', 'Baseline'),
        createMockSession(3, 'Primary', 'Treatment'), // Different condition between session 1 and 5
        createMockSession(5, 'Primary', 'Baseline'),
        createMockSession(7, 'Primary', 'Treatment'), // Different condition between session 5 and 10
        createMockSession(10, 'Primary', 'Baseline'),
      ];

      const result = calculateSplitPoints(conditionData, filteredSessions, 'Baseline');

      expect(result).toEqual([1, 2]); // Split points at indices 1 and 2
    });

    it('should return empty array when no split points needed', () => {
      const conditionData = [{ session: 1 }, { session: 2 }, { session: 3 }];

      const filteredSessions = [
        createMockSession(1, 'Primary', 'Baseline'),
        createMockSession(2, 'Primary', 'Baseline'),
        createMockSession(3, 'Primary', 'Baseline'),
      ];

      const result = calculateSplitPoints(conditionData, filteredSessions, 'Baseline');

      expect(result).toEqual([]);
    });

    it('should handle single data point', () => {
      const conditionData = [{ session: 1 }];
      const filteredSessions = [createMockSession(1, 'Primary', 'Baseline')];

      const result = calculateSplitPoints(conditionData, filteredSessions, 'Baseline');

      expect(result).toEqual([]);
    });

    it('should handle empty condition data', () => {
      const conditionData: any[] = [];
      const filteredSessions = [createMockSession(1, 'Primary', 'Baseline')];

      const result = calculateSplitPoints(conditionData, filteredSessions, 'Baseline');

      expect(result).toEqual([]);
    });
  });

  describe('createChartLegends', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should create legends for conditions and visible keys', () => {
      const filteredSessions = [
        createMockSession(1, 'Primary', 'Baseline'),
        createMockSession(2, 'Primary', 'Treatment'),
        createMockSession(3, 'Primary', 'Baseline'),
        createMockSession(4, 'Primary', 'Maintenance'),
      ];

      const keySetFull: ExpandedKeySetInstance[] = [
        { KeyDescription: 'Key1', Visible: true },
        { KeyDescription: 'Key2', Visible: false },
        { KeyDescription: 'Key3', Visible: true },
      ];

      const result = createChartLegends(filteredSessions, keySetFull);

      // Should have 3 condition legends + 2 visible key legends
      expect(result).toHaveLength(5);

      // Check condition legends
      expect(result[0]).toEqual({
        id: 'Baseline',
        type: 'circle',
        value: 'Baseline',
        color: '#9061C2', // First color from FIGURE_PATH_COLORS
      });

      expect(result[1]).toEqual({
        id: 'Treatment',
        type: 'circle',
        value: 'Treatment',
        color: '#4E9CB5', // Second color from FIGURE_PATH_COLORS
      });

      expect(result[2]).toEqual({
        id: 'Maintenance',
        type: 'circle',
        value: 'Maintenance',
        color: '#4BC599', // Third color from FIGURE_PATH_COLORS
      });

      // Check key legends (only visible ones)
      expect(result[3]).toEqual({
        id: 'Key1',
        type: 'circle', // getShape(0) returns 'circle'
        value: 'Key1',
        color: 'black',
      });

      expect(result[4]).toEqual({
        id: 'Key3',
        type: 'cross', // getShape(1) returns 'cross'
        value: 'Key3',
        color: 'black',
      });

      // Verify getShape was called correctly
      expect(getShape).toHaveBeenCalledWith(0);
      expect(getShape).toHaveBeenCalledWith(1);
      expect(getShape).toHaveBeenCalledTimes(2);
    });

    it('should handle empty filtered sessions', () => {
      const filteredSessions: SavedSessionResult[] = [];
      const keySetFull: ExpandedKeySetInstance[] = [{ KeyDescription: 'Key1', Visible: true }];

      const result = createChartLegends(filteredSessions, keySetFull);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'Key1',
        type: 'circle',
        value: 'Key1',
        color: 'black',
      });
    });

    it('should handle empty keyset', () => {
      const filteredSessions = [createMockSession(1, 'Primary', 'Baseline')];
      const keySetFull: ExpandedKeySetInstance[] = [];

      const result = createChartLegends(filteredSessions, keySetFull);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'Baseline',
        type: 'circle',
        value: 'Baseline',
        color: '#9061C2',
      });
    });

    it('should filter out invisible keys', () => {
      const filteredSessions = [createMockSession(1, 'Primary', 'Baseline')];
      const keySetFull: ExpandedKeySetInstance[] = [
        { KeyDescription: 'Key1', Visible: false },
        { KeyDescription: 'Key2', Visible: false },
      ];

      const result = createChartLegends(filteredSessions, keySetFull);

      expect(result).toHaveLength(1); // Only condition legend
      expect(result[0]).toEqual({
        id: 'Baseline',
        type: 'circle',
        value: 'Baseline',
        color: '#9061C2',
      });
    });
  });

  describe('getChartConfiguration', () => {
    it('should return consistent chart configuration object', () => {
      const config = getChartConfiguration();

      expect(config).toEqual({
        noAnimationProps: {
          isAnimationActive: false,
          animationDuration: 0,
        },
        chartMargins: {
          top: 50,
          right: 10,
          left: 10,
          bottom: 10,
        },
        xAxisConfig: {
          height: 50,
          interval: 'equidistantPreserveStart',
          minTickGap: 25,
          type: 'number',
          dy: 5,
          padding: {
            left: 50,
            right: 50,
          },
          style: {
            stroke: 'black',
            strokeWidth: 1,
          },
        },
        yAxisConfig: {
          width: 50,
          padding: {
            left: 50,
            right: 50,
          },
          style: {
            stroke: 'black',
            strokeWidth: 1,
          },
        },
        yAxisStyle: {
          stroke: 'black',
          strokeWidth: 1,
        },
        labelStyle: {
          textAnchor: 'middle',
          fill: 'black',
          fontWeight: 'bold',
        },
      });
    });

    it('should return same configuration on multiple calls', () => {
      const config1 = getChartConfiguration();
      const config2 = getChartConfiguration();

      expect(config1).toEqual(config2);
    });
  });

  describe('createNavigationHandler', () => {
    it('should create navigation handler that calls navigate with correct parameters', () => {
      const mockNavigate = vi.fn();
      const group = 'testGroup';
      const individual = 'testIndividual';
      const evaluation = 'testEvaluation';

      const handler = createNavigationHandler(mockNavigate, group, individual, evaluation);

      const props = {
        session: 5,
        Condition: 'Baseline',
      };

      handler(props);

      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/session/$group/$individual/$evaluation/history/view/$file',
        params: {
          group: 'testGroup',
          individual: 'testIndividual',
          evaluation: 'testEvaluation',
          file: '5_Baseline_Primary',
        },
      });
    });

    it('should handle different session numbers and conditions', () => {
      const mockNavigate = vi.fn();
      const handler = createNavigationHandler(mockNavigate, 'group1', 'individual1', 'eval1');

      const props = {
        session: 10,
        Condition: 'Treatment',
      };

      handler(props);

      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/session/$group/$individual/$evaluation/history/view/$file',
        params: {
          group: 'group1',
          individual: 'individual1',
          evaluation: 'eval1',
          file: '10_Treatment_Primary',
        },
      });
    });
  });
});
