import { KeySet, KeySetInstance } from '../../types/keyset/core';
import { v4 as uuidv4 } from 'uuid';
import { createNewKeySet, deserializeKeySet, serializeKeySet } from '../keyset';
import { SavedSessionResult } from '../dtos/session-results';
import { SavedSettings } from '../dtos/session-settings';
import { ModifiedSessionResult } from '@/types/storage';
import { Mock, vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('uuid', () => ({
  v4: vi.fn(),
}));

describe('KeySet Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to create a mock KeySet
  const createMockKeySet = (name: string = 'Test KeySet'): KeySet => ({
    id: `keyset-${name.toLowerCase().replace(/\s+/g, '-')}`,
    Name: name,
    FrequencyKeys: [{ KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65 }] as KeySetInstance[],
    DurationKeys: [{ KeyName: 'D', KeyDescription: 'Key D', KeyCode: 68 }] as KeySetInstance[],
    createdAt: new Date('2024-01-01'),
    lastModified: new Date('2024-01-01'),
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
  });

  // Helper function to create a mock SavedSessionResult
  const createMockSavedSession = (sessionNumber: number, keysetName: string = 'Test KeySet'): SavedSessionResult => ({
    Keyset: createMockKeySet(keysetName),
    SessionSettings: {
      Session: sessionNumber,
      Therapist: 'Test Therapist',
      Condition: 'Baseline',
      KeySet: 'test-keyset',
      TimerOption: 'End on Timer #1',
      Initials: 'TT',
      Role: 'Primary',
      DurationS: 600,
    } as SavedSettings,
    SystemKeyPresses: [],
    FrequencyKeyPresses: [],
    DurationKeyPresses: [],
    SessionStart: '2024-01-01T10:00:00Z',
    SessionEnd: '2024-01-01T10:10:00Z',
    SpecialKeyTimers: {},
    EndedEarly: false,
    TimerMain: 600,
    TimerOne: 300,
    TimerTwo: 450,
    TimerThree: 500,
  });

  // Helper function to create a mock ModifiedSessionResult
  const createMockModifiedSession = (
    sessionNumber: number,
    keysetName: string = 'Test KeySet',
    filename: string = 'test.json',
  ): ModifiedSessionResult => ({
    ...createMockSavedSession(sessionNumber, keysetName),
    Filename: filename,
  });

  describe('createNewKeySet', () => {
    it('should create a new KeySet with the given name and generate a unique id', () => {
      const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
      (uuidv4 as Mock).mockReturnValue(mockUUID);

      const keySetName = 'Test KeySet';
      const result = createNewKeySet(keySetName);

      expect(result.Name).toBe(keySetName);
      expect(result.FrequencyKeys).toEqual([]);
      expect(result.DurationKeys).toEqual([]);
      expect(result.id).toBe(mockUUID);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.lastModified).toBeInstanceOf(Date);
    });
  });

  describe('serializeKeySet', () => {
    it('should correctly serialize a KeySet', () => {
      const keySet: KeySet = {
        id: 'test-id',
        Name: 'Test KeySet',
        FrequencyKeys: [{ KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65 }],
        DurationKeys: [{ KeyName: 'D', KeyDescription: 'Key D', KeyCode: 68 }],
        createdAt: new Date('2024-09-07T12:00:00Z'),
        lastModified: new Date('2024-09-07T13:00:00Z'),
        DerivedKeys: [],
        SpecialDurationKeys: [],
        ScorableDurationKeys: [],
      };

      const expectedSerialization = JSON.stringify({
        id: 'test-id',
        Name: 'Test KeySet',
        FrequencyKeys: [{ KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65 }],
        DurationKeys: [{ KeyName: 'D', KeyDescription: 'Key D', KeyCode: 68 }],
        createdAt: '2024-09-07T12:00:00.000Z',
        lastModified: '2024-09-07T13:00:00.000Z',
        DerivedKeys: [],
        SpecialDurationKeys: [],
        ScorableDurationKeys: [],
      });

      const result = serializeKeySet(keySet);
      expect(result).toBe(expectedSerialization);
    });
  });

  describe('deserializeKeySet', () => {
    it('should correctly deserialize a KeySet from JSON', () => {
      const serializedKeySet = JSON.stringify({
        id: 'test-id',
        Name: 'Test KeySet',
        FrequencyKeys: [{ KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65 }],
        DurationKeys: [{ KeyName: 'D', KeyDescription: 'Key D', KeyCode: 68 }],
        createdAt: '2024-09-07T12:00:00.000Z',
        lastModified: '2024-09-07T13:00:00.000Z',
        DerivedKeys: [],
        SpecialDurationKeys: [],
      });

      const expectedKeySet: KeySet = {
        id: 'test-id',
        Name: 'Test KeySet',
        FrequencyKeys: [{ KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65 }],
        DurationKeys: [{ KeyName: 'D', KeyDescription: 'Key D', KeyCode: 68 }],
        createdAt: new Date('2024-09-07T12:00:00Z'),
        lastModified: new Date('2024-09-07T13:00:00Z'),
        DerivedKeys: [],
        SpecialDurationKeys: [],
        ScorableDurationKeys: [],
      };

      const result = deserializeKeySet(serializedKeySet);
      expect(result).toEqual(expectedKeySet);
    });

    it('should handle invalid JSON gracefully', () => {
      const invalidJSON = 'invalid json string';

      expect(() => deserializeKeySet(invalidJSON)).toThrow();
    });

    it('should default missing key lists to empty arrays', () => {
      const incompleteJSON = JSON.stringify({
        id: 'test-id',
        Name: 'Test KeySet',
        // Missing other properties
      });

      const result = deserializeKeySet(incompleteJSON);

      expect(result.id).toBe('test-id');
      expect(result.Name).toBe('Test KeySet');
      expect(result.FrequencyKeys).toEqual([]);
      expect(result.DurationKeys).toEqual([]);
    });

    it('should drop malformed key entries and keep valid ones', () => {
      const json = JSON.stringify({
        id: 'test-id',
        Name: 'Test KeySet',
        FrequencyKeys: [
          { KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65 },
          { KeyName: 'B', KeyCode: 'not-a-number' },
          'junk',
        ],
        DurationKeys: 'not-a-list',
      });

      const result = deserializeKeySet(json);

      expect(result.FrequencyKeys).toEqual([{ KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65 }]);
      expect(result.DurationKeys).toEqual([]);
    });

    it('should reject a keyset without an id or Name', () => {
      expect(() => deserializeKeySet(JSON.stringify({ Name: 'No Id' }))).toThrow();
      expect(() => deserializeKeySet(JSON.stringify({ id: 'x' }))).toThrow();
    });

    it('should handle date parsing errors gracefully', () => {
      const JSONWithInvalidDates = JSON.stringify({
        id: 'test-id',
        Name: 'Test KeySet',
        FrequencyKeys: [],
        DurationKeys: [],
        createdAt: 'invalid-date',
        lastModified: 'invalid-date',
      });

      const result = deserializeKeySet(JSONWithInvalidDates);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.lastModified).toBeInstanceOf(Date);
      expect(isNaN(result.createdAt.getTime())).toBe(true); // Invalid date
      expect(isNaN(result.lastModified.getTime())).toBe(true); // Invalid date
    });
  });
});
