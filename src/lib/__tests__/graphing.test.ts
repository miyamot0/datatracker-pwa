import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SavedSessionResult } from '../dtos';
import { KeySet, KeySetInstance } from '@/types/keyset/core';
import { ExpandedKeySetInstance } from '@/types/keyset/display';
import { ModifiedSessionResult } from '@/types/storage';
import { ToggleDisplayKey } from '@/types/visuals';

// Mock the helper functions from schedule_parser
vi.mock('@/lib/schedule-parser', () => ({
  walkSessionFrequencyKey: vi.fn(),
  walkSessionDurationKeyStateAware: vi.fn(),
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

// Mock logic evaluation
vi.mock('@/lib/logic', () => ({
  evaluateLogic: vi.fn(),
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
  prepareRateDataUniversal,
  prepareProportionDataUniversal,
} from '../graphing';

// Import the mocked functions for use in tests
import { walkSessionFrequencyKey, walkSessionDurationKeyStateAware } from '@/lib/schedule-parser';
import { SessionTerminationOptionsType } from '@/types/terminations';
import { getShape } from '@/lib/shapes';
import { evaluateLogic, LogicState } from '@/lib/logic';
import { ProcessedSessionData } from '@/types/calculation';

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
    ScorableDurationKeys: [],
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

      (walkSessionDurationKeyStateAware as any).mockReturnValue({
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

      // Verify walkSessionDurationKeyStateAware was called with correct parameters
      expect(walkSessionDurationKeyStateAware).toHaveBeenCalledWith(
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

      (walkSessionDurationKeyStateAware as any)
        .mockReturnValueOnce({ KeyName: 'DurKey1', Value: 30.5 })
        .mockReturnValueOnce({ KeyName: 'DurKey2', Value: 45.2 });

      const result = generateChartPreparation(sessions, 'End on Timer #1', 'Duration');

      expect(result[0].Scores).toHaveLength(2);
      expect(walkSessionDurationKeyStateAware).toHaveBeenCalledTimes(2);
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
      derivedKeys: LogicState[] = [],
      filename = `session${session}.json`,
    ): ModifiedSessionResult => ({
      ...createMockSession(session),
      Keyset: {
        ...createMockKeySet(frequencyKeys, durationKeys),
        DerivedKeys: derivedKeys,
      },
      Filename: filename,
    });

    const createMockLogicState = (id: string, name: string): LogicState => ({
      id,
      name,
      initial: { type: 'constant', value: 0 },
      fields: [],
      steps: [],
      value: 0,
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

    it('should deduplicate derived keys across multiple sessions', () => {
      const derived1 = createMockLogicState('id1', 'Derived Key 1');
      const derived2 = createMockLogicState('id2', 'Derived Key 2');
      const derived1Duplicate = createMockLogicState('id1', 'Derived Key 1'); // Same id

      const sessions = [
        createMockModifiedSession(1, [], [], [derived1, derived2]),
        createMockModifiedSession(2, [], [], [derived1Duplicate]),
        createMockModifiedSession(3, [], [], [derived2]),
      ];

      const keyset = {
        ...createMockKeySet([], []),
        DerivedKeys: [derived1, derived2],
      };

      const result = extractAndDeduplicateKeysets(sessions, keyset);

      expect(result.derivedKeys).toHaveLength(2);
      expect(result.derivedKeys).toEqual([derived1, derived2]);
    });

    it('should deduplicate special and scorable duration keys', () => {
      const special1: KeySetInstance = { KeyName: 'Special1', KeyDescription: 'Special 1', KeyCode: 71 };
      const special1Duplicate: KeySetInstance = { KeyName: 'Special1', KeyDescription: 'Special 1', KeyCode: 71 };
      const special2: KeySetInstance = { KeyName: 'Special2', KeyDescription: 'Special 2', KeyCode: 72 };

      const scorable1: KeySetInstance = { KeyName: 'Scorable1', KeyDescription: 'Scorable 1', KeyCode: 81 };
      const scorable1Duplicate: KeySetInstance = { KeyName: 'Scorable1', KeyDescription: 'Scorable 1', KeyCode: 81 };
      const scorable2: KeySetInstance = { KeyName: 'Scorable2', KeyDescription: 'Scorable 2', KeyCode: 82 };

      const sessions = [
        {
          ...createMockModifiedSession(1),
          Keyset: {
            ...createMockKeySet(),
            SpecialDurationKeys: [special1, special2],
            ScorableDurationKeys: [scorable1],
          },
        },
        {
          ...createMockModifiedSession(2),
          Keyset: {
            ...createMockKeySet(),
            SpecialDurationKeys: [special1Duplicate],
            ScorableDurationKeys: [scorable1Duplicate, scorable2],
          },
        },
      ] as ModifiedSessionResult[];

      const keyset = {
        ...createMockKeySet(),
        SpecialDurationKeys: [special1],
        ScorableDurationKeys: [scorable1],
      } as KeySet;

      const result = extractAndDeduplicateKeysets(sessions, keyset);

      expect(result.specialDurationKeys).toEqual([special1, special2]);
      expect(result.scorableDurationKeys).toEqual([scorable1, scorable2]);
    });

    it('should handle sessions with no keys', () => {
      const sessions = [createMockModifiedSession(1, [], []), createMockModifiedSession(2, [], [])];

      const keyset = createMockKeySet([], []);
      const result = extractAndDeduplicateKeysets(sessions, keyset);

      expect(result.frequencyKeys).toHaveLength(0);
      expect(result.durationKeys).toHaveLength(0);
      expect(result.derivedKeys).toHaveLength(0);
    });

    it('should handle empty input array', () => {
      const keyset = createMockKeySet([], []);
      const result = extractAndDeduplicateKeysets([], keyset);

      expect(result.frequencyKeys).toHaveLength(0);
      expect(result.durationKeys).toHaveLength(0);
      expect(result.derivedKeys).toHaveLength(0);
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

    it('should include keys from latest keyset even if not in sessions', () => {
      const sessionKey: KeySetInstance = { KeyName: 'SessionKey', KeyDescription: 'Session Key', KeyCode: 65 };
      const latestKey: KeySetInstance = { KeyName: 'LatestKey', KeyDescription: 'Latest Key', KeyCode: 66 };

      const sessions = [createMockModifiedSession(1, [sessionKey], [])];

      const keyset = createMockKeySet([sessionKey, latestKey], []);
      const result = extractAndDeduplicateKeysets(sessions, keyset);

      expect(result.frequencyKeys).toHaveLength(2);
      expect(result.frequencyKeys).toEqual([sessionKey, latestKey]);
    });

    it('should handle sessions with undefined derived keys', () => {
      const freqKey: KeySetInstance = { KeyName: 'FreqKey', KeyDescription: 'Frequency Key', KeyCode: 65 };

      // Create session with keyset that has undefined DerivedKeys
      const session: ModifiedSessionResult = {
        ...createMockSession(1),
        Keyset: {
          ...createMockKeySet([freqKey], []),
          DerivedKeys: undefined as any, // Simulate undefined derived keys
        },
        Filename: 'session1.json',
      };

      const keyset = createMockKeySet([freqKey], []);
      const result = extractAndDeduplicateKeysets([session], keyset);

      expect(result.frequencyKeys).toHaveLength(1);
      expect(result.derivedKeys).toHaveLength(0); // Should handle undefined gracefully
    });

    it('should handle undefined special and scorable duration keys', () => {
      const session: ModifiedSessionResult = {
        ...createMockSession(1),
        Keyset: {
          ...createMockKeySet(),
          SpecialDurationKeys: undefined as any,
          ScorableDurationKeys: undefined as any,
        },
        Filename: 'session1.json',
      };

      const keyset = {
        ...createMockKeySet(),
        SpecialDurationKeys: undefined as any,
        ScorableDurationKeys: undefined as any,
      } as KeySet;

      const result = extractAndDeduplicateKeysets([session], keyset);

      expect(result.specialDurationKeys).toEqual([]);
      expect(result.scorableDurationKeys).toEqual([]);
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

  describe('generateChartPreparation - Derived Keys', () => {
    const mockFrequencyKey: KeySetInstance = {
      KeyName: 'FreqKey1',
      KeyDescription: 'Frequency Key 1',
      KeyCode: 65,
    };

    const createMockLogicState = (overrides: Partial<LogicState> = {}): LogicState => ({
      id: 'logic-1',
      name: 'Derived Key 1',
      initial: { type: 'constant', value: 0 },
      fields: [
        {
          KeyName: 'FreqKey1',
          KeyDescription: 'Frequency Key 1',
          KeyCode: 65,
          Value: 0,
          Tag: 'test',
        },
      ],
      steps: [],
      value: 0,
      ...overrides,
    });

    beforeEach(() => {
      vi.clearAllMocks();

      // Setup default mock returns
      (walkSessionFrequencyKey as any).mockReturnValue({
        KeyName: 'FreqKey1',
        KeyDescription: 'Frequency Key 1',
        Schedule: 'Primary',
        Value: 10,
        Bouts: -1,
      });

      (evaluateLogic as any).mockReturnValue(25.5);
    });

    it('should process derived keys when DynamicKeySet is provided', () => {
      const keyset = createMockKeySet([mockFrequencyKey], []);
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      const keySetFull: ExpandedKeySetInstance[] = [{ KeyDescription: 'Derived Key 1', Visible: true }];

      const dynamicKeySet: KeySet = {
        ...keyset,
        DerivedKeys: [createMockLogicState()],
      };

      const result = generateChartPreparation(sessions, 'End on Timer #1', 'Frequency', keySetFull, dynamicKeySet);

      expect(result[0].Scores).toHaveLength(2); // Original frequency key + derived key
      expect(evaluateLogic).toHaveBeenCalledWith(
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({
              KeyDescription: 'Frequency Key 1',
              Value: 10, // Value from walkSessionFrequencyKey
            }),
          ]),
        }),
      );

      // Check that derived key was added to scores
      const derivedScore = result[0].Scores.find((s) => s.KeyName === 'Derived Key 1');
      expect(derivedScore).toBeDefined();
      expect(derivedScore?.Value).toBe(25.5);
    });

    it('should handle derived keys with missing field keys (NaN values)', () => {
      const keyset = createMockKeySet([mockFrequencyKey], []);
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      const keySetFull: ExpandedKeySetInstance[] = [{ KeyDescription: 'Derived Key 1', Visible: true }];

      const logicState = createMockLogicState({
        fields: [
          {
            KeyName: 'MissingKey',
            KeyDescription: 'Missing Key',
            KeyCode: 999,
            Value: 0,
            Tag: 'test',
          },
        ],
      });

      const dynamicKeySet: KeySet = {
        ...keyset,
        DerivedKeys: [logicState],
      };

      const result = generateChartPreparation(sessions, 'End on Timer #1', 'Frequency', keySetFull, dynamicKeySet);

      expect(evaluateLogic).toHaveBeenCalledWith(
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({
              KeyDescription: 'Missing Key',
              Value: NaN, // Should be NaN for missing key
            }),
          ]),
        }),
      );
    });

    it('should only include visible derived keys in scores', () => {
      const keyset = createMockKeySet([mockFrequencyKey], []);
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      const keySetFull: ExpandedKeySetInstance[] = [
        { KeyDescription: 'Visible Derived', Visible: true },
        { KeyDescription: 'Hidden Derived', Visible: false },
      ];

      const dynamicKeySet: KeySet = {
        ...keyset,
        DerivedKeys: [
          createMockLogicState({ name: 'Visible Derived' }),
          createMockLogicState({ name: 'Hidden Derived' }),
        ],
      };

      const result = generateChartPreparation(sessions, 'End on Timer #1', 'Frequency', keySetFull, dynamicKeySet);

      expect(result[0].Scores).toHaveLength(2); // Original frequency key + 1 visible derived key
      expect(result[0].Scores.find((s) => s.KeyName === 'Visible Derived')).toBeDefined();
      expect(result[0].Scores.find((s) => s.KeyName === 'Hidden Derived')).toBeUndefined();
    });

    it('should handle multiple derived keys', () => {
      const keyset = createMockKeySet([mockFrequencyKey], []);
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      const keySetFull: ExpandedKeySetInstance[] = [
        { KeyDescription: 'Derived Key 1', Visible: true },
        { KeyDescription: 'Derived Key 2', Visible: true },
      ];

      (evaluateLogic as any).mockReturnValueOnce(15.0).mockReturnValueOnce(30.0);

      const dynamicKeySet: KeySet = {
        ...keyset,
        DerivedKeys: [createMockLogicState({ name: 'Derived Key 1' }), createMockLogicState({ name: 'Derived Key 2' })],
      };

      const result = generateChartPreparation(sessions, 'End on Timer #1', 'Frequency', keySetFull, dynamicKeySet);

      expect(result[0].Scores).toHaveLength(3); // 1 frequency + 2 derived
      expect(evaluateLogic).toHaveBeenCalledTimes(2);

      const derived1 = result[0].Scores.find((s) => s.KeyName === 'Derived Key 1');
      const derived2 = result[0].Scores.find((s) => s.KeyName === 'Derived Key 2');

      expect(derived1?.Value).toBe(15.0);
      expect(derived2?.Value).toBe(30.0);
    });

    it('should handle no derived keys gracefully', () => {
      const keyset = createMockKeySet([mockFrequencyKey], []);
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      const keySetFull: ExpandedKeySetInstance[] = [];

      const dynamicKeySet: KeySet = {
        ...keyset,
        DerivedKeys: [],
      };

      const result = generateChartPreparation(sessions, 'End on Timer #1', 'Frequency', keySetFull, dynamicKeySet);

      expect(result[0].Scores).toHaveLength(1); // Only original frequency key
      expect(evaluateLogic).not.toHaveBeenCalled();
    });

    it('should handle undefined DynamicKeySet gracefully', () => {
      const keyset = createMockKeySet([mockFrequencyKey], []);
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      const keySetFull: ExpandedKeySetInstance[] = [{ KeyDescription: 'Some Key', Visible: true }];

      const result = generateChartPreparation(sessions, 'End on Timer #1', 'Frequency', keySetFull, undefined);

      expect(result[0].Scores).toHaveLength(1); // Only original frequency key
      expect(evaluateLogic).not.toHaveBeenCalled();
    });
  });

  describe('Additional generateChartPreparation Edge Cases', () => {
    const mockFrequencyKey: KeySetInstance = {
      KeyName: 'FreqKey1',
      KeyDescription: 'Frequency Key 1',
      KeyCode: 65,
    };

    beforeEach(() => {
      vi.clearAllMocks();
      (walkSessionFrequencyKey as any).mockReturnValue({
        KeyName: 'FreqKey1',
        KeyDescription: 'Frequency Key 1',
        Schedule: 'Primary',
        Value: 10,
        Bouts: -1,
      });
    });

    it('should handle pullSessionTime for all valid timer options', () => {
      const keyset = createMockKeySet([], []); // Empty to avoid convertScheduleSetting issues
      const session = createMockSession(1, 'Primary', 'Baseline', keyset);
      const sessions = [session];

      // Test End on Primary Timer
      const result1 = generateChartPreparation(sessions, 'End on Primary Timer', 'Frequency');
      expect(result1[0].SessionTime).toBe(600); // TimerMain

      // Test End on Timer #1
      const result2 = generateChartPreparation(sessions, 'End on Timer #1', 'Frequency');
      expect(result2[0].SessionTime).toBe(300); // TimerOne

      // Test End on Timer #2
      const result3 = generateChartPreparation(sessions, 'End on Timer #2', 'Frequency');
      expect(result3[0].SessionTime).toBe(450); // TimerTwo

      // Test End on Timer #3
      const result4 = generateChartPreparation(sessions, 'End on Timer #3', 'Frequency');
      expect(result4[0].SessionTime).toBe(500); // TimerThree
    });

    it('should handle different timer values in pullSessionTime', () => {
      const keyset = createMockKeySet([], []);
      const session = createMockSession(1, 'Primary', 'Baseline', keyset);

      // Override timer values
      session.TimerMain = 1200;
      session.TimerOne = 600;
      session.TimerTwo = 900;
      session.TimerThree = 750;

      const sessions = [session];

      const result1 = generateChartPreparation(sessions, 'End on Primary Timer', 'Frequency');
      expect(result1[0].SessionTime).toBe(1200);

      const result2 = generateChartPreparation(sessions, 'End on Timer #1', 'Frequency');
      expect(result2[0].SessionTime).toBe(600);

      const result3 = generateChartPreparation(sessions, 'End on Timer #2', 'Frequency');
      expect(result3[0].SessionTime).toBe(900);

      const result4 = generateChartPreparation(sessions, 'End on Timer #3', 'Frequency');
      expect(result4[0].SessionTime).toBe(750);
    });

    it('should throw error for completely invalid schedule option in pullSessionTime', () => {
      const keyset = createMockKeySet([], []);
      const sessions = [createMockSession(1, 'Primary', 'Baseline', keyset)];

      expect(() => {
        generateChartPreparation(sessions, 'Completely Invalid Option' as SessionTerminationOptionsType, 'Frequency');
      }).toThrow('Invalid Schedule Option');
    });
  });

  describe('prepareRateDataUniversal', () => {
    const createMockProcessedSession = (
      session: number,
      condition: string,
      frequencyKeys: any[] = [],
      derivedKeys: any[] = [],
    ): ProcessedSessionData => ({
      session,
      condition,
      date: new Date('2024-01-01'),
      collector: 'TT',
      therapist: 'Dr. Test',
      timerType: 'Timer1',
      timerLabel: 'Timer #1',
      timerDuration: 10.0,
      frequencyKeys,
      durationKeys: [],
      derivedKeys,
    });

    it('should prepare rate data for frequency keys', () => {
      const scoredSessions = [
        createMockProcessedSession(
          1,
          'Baseline',
          [
            {
              keyName: 'FreqKey1',
              keyDescription: 'Frequency Key 1',
              rate: 2.5,
            },
            {
              keyName: 'FreqKey2',
              keyDescription: 'Frequency Key 2',
              rate: 4.0,
            },
          ],
          [],
        ),
        createMockProcessedSession(
          2,
          'Treatment',
          [
            {
              keyName: 'FreqKey1',
              keyDescription: 'Frequency Key 1',
              rate: 3.5,
            },
            {
              keyName: 'FreqKey2',
              keyDescription: 'Frequency Key 2',
              rate: 1.8,
            },
          ],
          [],
        ),
      ];

      const result = prepareRateDataUniversal(scoredSessions);

      expect(result.preparedData).toHaveLength(2);
      expect(result.maxY).toBe(4.0); // Highest rate

      // Check first session data
      expect(result.preparedData[0]).toEqual({
        session: 1,
        Condition: 'Baseline',
        SessionTime: 10.0,
        'Frequency Key 1': 2.5,
        'Frequency Key 2': 4.0,
      });

      // Check second session data
      expect(result.preparedData[1]).toEqual({
        session: 2,
        Condition: 'Treatment',
        SessionTime: 10.0,
        'Frequency Key 1': 3.5,
        'Frequency Key 2': 1.8,
      });
    });

    it('should prepare rate data for derived keys', () => {
      const scoredSessions = [
        createMockProcessedSession(
          1,
          'Baseline',
          [],
          [
            {
              keyName: 'DerivedKey1',
              keyDescription: 'Derived Key 1',
              rate: 1.5,
            },
            {
              keyName: 'DerivedKey2',
              keyDescription: 'Derived Key 2',
              rate: 2.8,
            },
          ],
        ),
      ];

      const result = prepareRateDataUniversal(scoredSessions);

      expect(result.preparedData).toHaveLength(1);
      expect(result.maxY).toBe(2.8);

      expect(result.preparedData[0]).toEqual({
        session: 1,
        Condition: 'Baseline',
        SessionTime: 10.0,
        'Derived Key 1': 1.5,
        'Derived Key 2': 2.8,
      });
    });

    it('should handle mixed frequency and derived keys', () => {
      const scoredSessions = [
        createMockProcessedSession(
          1,
          'Combined',
          [
            {
              keyName: 'FreqKey1',
              keyDescription: 'Frequency Key 1',
              rate: 3.0,
            },
          ],
          [
            {
              keyName: 'DerivedKey1',
              keyDescription: 'Derived Key 1',
              rate: 5.2,
            },
          ],
        ),
      ];

      const result = prepareRateDataUniversal(scoredSessions);

      expect(result.preparedData).toHaveLength(1);
      expect(result.maxY).toBe(5.2); // Highest rate from derived key

      expect(result.preparedData[0]).toEqual({
        session: 1,
        Condition: 'Combined',
        SessionTime: 10.0,
        'Frequency Key 1': 3.0,
        'Derived Key 1': 5.2,
      });
    });

    it('should handle keys without rate values', () => {
      const scoredSessions = [
        createMockProcessedSession(
          1,
          'NoRate',
          [
            {
              keyName: 'FreqKey1',
              keyDescription: 'Frequency Key 1',
              // No rate property
            },
          ],
          [
            {
              keyName: 'DerivedKey1',
              keyDescription: 'Derived Key 1',
              rate: 1.0,
            },
          ],
        ),
      ];

      const result = prepareRateDataUniversal(scoredSessions);

      expect(result.preparedData).toHaveLength(1);
      expect(result.maxY).toBe(1.0); // Only counting keys with rates

      expect(result.preparedData[0]).toEqual({
        session: 1,
        Condition: 'NoRate',
        SessionTime: 10.0,
        'Frequency Key 1': undefined, // No rate value
        'Derived Key 1': 1.0,
      });
    });

    it('should handle empty sessions', () => {
      const result = prepareRateDataUniversal([]);

      expect(result.preparedData).toEqual([]);
      expect(result.maxY).toBe(0);
    });

    it('should handle sessions with no keys', () => {
      const scoredSessions = [createMockProcessedSession(1, 'Empty', [], [])];

      const result = prepareRateDataUniversal(scoredSessions);

      expect(result.preparedData).toHaveLength(1);
      expect(result.maxY).toBe(0);

      expect(result.preparedData[0]).toEqual({
        session: 1,
        Condition: 'Empty',
        SessionTime: 10.0,
      });
    });

    it('should handle zero and negative rates', () => {
      const scoredSessions = [
        createMockProcessedSession(
          1,
          'EdgeRates',
          [
            {
              keyName: 'ZeroKey',
              keyDescription: 'Zero Rate Key',
              rate: 0,
            },
            {
              keyName: 'NegativeKey',
              keyDescription: 'Negative Rate Key',
              rate: -1.5,
            },
          ],
          [],
        ),
      ];

      const result = prepareRateDataUniversal(scoredSessions);

      expect(result.preparedData).toHaveLength(1);
      expect(result.maxY).toBe(0); // Max of 0 and -1.5

      expect(result.preparedData[0]).toEqual({
        session: 1,
        Condition: 'EdgeRates',
        SessionTime: 10.0,
        'Zero Rate Key': 0,
        'Negative Rate Key': -1.5,
      });
    });

    it('should keep maxY when derived rate is lower than current max', () => {
      const scoredSessions = [
        createMockProcessedSession(
          1,
          'DerivedBelowMax',
          [
            {
              keyName: 'FreqMax',
              keyDescription: 'Frequency Max',
              rate: 5.5,
            },
          ],
          [
            {
              keyName: 'DerivedLower',
              keyDescription: 'Derived Lower',
              rate: 1.2,
            },
          ],
        ),
      ];

      const result = prepareRateDataUniversal(scoredSessions);

      expect(result.maxY).toBe(5.5);
      expect(result.preparedData[0]['Derived Lower']).toBe(1.2);
    });
  });

  describe('prepareProportionDataUniversal', () => {
    const createMockProcessedSession = (
      session: number,
      condition: string,
      durationKeys: any[] = [],
    ): ProcessedSessionData => ({
      session,
      condition,
      date: new Date('2024-01-01'),
      collector: 'TT',
      therapist: 'Dr. Test',
      timerType: 'Timer1',
      timerLabel: 'Timer #1',
      timerDuration: 10.0,
      frequencyKeys: [],
      durationKeys,
      derivedKeys: [],
    });

    it('should prepare proportion data for duration keys', () => {
      const scoredSessions = [
        createMockProcessedSession(1, 'Baseline', [
          {
            keyName: 'DurKey1',
            keyDescription: 'Duration Key 1',
            percentage: 25.5,
            bouts: 3,
            averageBout: 42.5,
          },
          {
            keyName: 'DurKey2',
            keyDescription: 'Duration Key 2',
            percentage: 35.2,
            bouts: 2,
            averageBout: 88.0,
          },
        ]),
        createMockProcessedSession(2, 'Treatment', [
          {
            keyName: 'DurKey1',
            keyDescription: 'Duration Key 1',
            percentage: 18.7,
            bouts: 1,
            averageBout: 112.3,
          },
          {
            keyName: 'DurKey2',
            keyDescription: 'Duration Key 2',
            percentage: 42.1,
            bouts: 4,
            averageBout: 63.2,
          },
        ]),
      ];

      const result = prepareProportionDataUniversal(scoredSessions);

      expect(result.preparedData).toHaveLength(2);

      // Check first session data
      expect(result.preparedData[0]).toEqual({
        session: 1,
        Condition: 'Baseline',
        SessionTime: 10.0,
        'Duration Key 1': 25.5,
        'Duration Key 1-Bouts': 3,
        'Duration Key 1-Bout-Ave': 42.5,
        'Duration Key 2': 35.2,
        'Duration Key 2-Bouts': 2,
        'Duration Key 2-Bout-Ave': 88.0,
      });

      // Check second session data
      expect(result.preparedData[1]).toEqual({
        session: 2,
        Condition: 'Treatment',
        SessionTime: 10.0,
        'Duration Key 1': 18.7,
        'Duration Key 1-Bouts': 1,
        'Duration Key 1-Bout-Ave': 112.3,
        'Duration Key 2': 42.1,
        'Duration Key 2-Bouts': 4,
        'Duration Key 2-Bout-Ave': 63.2,
      });
    });

    it('should handle duration keys with missing optional properties', () => {
      const scoredSessions = [
        createMockProcessedSession(1, 'Partial', [
          {
            keyName: 'DurKey1',
            keyDescription: 'Duration Key 1',
            percentage: 30.0,
            // Missing bouts and averageBout
          },
        ]),
      ];

      const result = prepareProportionDataUniversal(scoredSessions);

      expect(result.preparedData).toHaveLength(1);

      expect(result.preparedData[0]).toEqual({
        session: 1,
        Condition: 'Partial',
        SessionTime: 10.0,
        'Duration Key 1': 30.0,
        'Duration Key 1-Bouts': undefined,
        'Duration Key 1-Bout-Ave': undefined,
      });
    });

    it('should handle empty sessions', () => {
      const result = prepareProportionDataUniversal([]);

      expect(result.preparedData).toEqual([]);
    });

    it('should handle sessions with no duration keys', () => {
      const scoredSessions = [createMockProcessedSession(1, 'NoDuration', [])];

      const result = prepareProportionDataUniversal(scoredSessions);

      expect(result.preparedData).toHaveLength(1);

      expect(result.preparedData[0]).toEqual({
        session: 1,
        Condition: 'NoDuration',
        SessionTime: 10.0,
      });
    });

    it('should handle zero values gracefully', () => {
      const scoredSessions = [
        createMockProcessedSession(1, 'ZeroValues', [
          {
            keyName: 'ZeroKey',
            keyDescription: 'Zero Duration Key',
            percentage: 0,
            bouts: 0,
            averageBout: 0,
          },
        ]),
      ];

      const result = prepareProportionDataUniversal(scoredSessions);

      expect(result.preparedData).toHaveLength(1);

      expect(result.preparedData[0]).toEqual({
        session: 1,
        Condition: 'ZeroValues',
        SessionTime: 10.0,
        'Zero Duration Key': 0,
        'Zero Duration Key-Bouts': 0,
        'Zero Duration Key-Bout-Ave': 0,
      });
    });

    it('should handle multiple sessions with different key sets', () => {
      const scoredSessions = [
        createMockProcessedSession(1, 'Set1', [
          {
            keyName: 'Key1',
            keyDescription: 'Key 1',
            percentage: 20.0,
            bouts: 2,
            averageBout: 50.0,
          },
        ]),
        createMockProcessedSession(2, 'Set2', [
          {
            keyName: 'Key2',
            keyDescription: 'Key 2',
            percentage: 30.0,
            bouts: 1,
            averageBout: 120.0,
          },
        ]),
      ];

      const result = prepareProportionDataUniversal(scoredSessions);

      expect(result.preparedData).toHaveLength(2);

      expect(result.preparedData[0]).toEqual({
        session: 1,
        Condition: 'Set1',
        SessionTime: 10.0,
        'Key 1': 20.0,
        'Key 1-Bouts': 2,
        'Key 1-Bout-Ave': 50.0,
      });

      expect(result.preparedData[1]).toEqual({
        session: 2,
        Condition: 'Set2',
        SessionTime: 10.0,
        'Key 2': 30.0,
        'Key 2-Bouts': 1,
        'Key 2-Bout-Ave': 120.0,
      });
    });
  });
});
