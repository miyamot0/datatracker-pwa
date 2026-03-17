import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SavedSessionResult } from '../dtos';
import { KeySet, KeySetInstance } from '@/types/keyset';

// Mock the helper functions from schedule_parser
vi.mock('@/components/summary-outcomes/helpers/schedule_parser', () => ({
  walkSessionFrequencyKey: vi.fn(),
  walkSessionDurationKey: vi.fn(),
}));

import {
  filterSessionsByPrimaryRole,
  getUniqueSessionConditions,
  generateTicks,
  generateChartPreparation,
} from '../graphing';

// Import the mocked functions for use in tests
import { walkSessionFrequencyKey, walkSessionDurationKey } from '@/components/summary-outcomes/helpers/schedule_parser';
import { SessionTerminationOptionsType } from '@/types/terminations';

describe('graphing utility functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to create mock KeySet
  const createMockKeySet = (frequencyKeys: KeySetInstance[] = [], durationKeys: KeySetInstance[] = []): KeySet => ({
    id: 'test-keyset-1',
    Name: 'Test KeySet',
    FrequencyKeys: frequencyKeys,
    DurationKeys: durationKeys,
    createdAt: new Date('2024-01-01'),
    lastModified: new Date('2024-01-01'),
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
});
