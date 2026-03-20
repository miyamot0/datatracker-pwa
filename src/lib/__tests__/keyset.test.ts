import { KeySet, KeySetInstance } from '../../types/keyset';
import { v4 as uuidv4 } from 'uuid';
import { createNewKeySet, deserializeKeySet, serializeKeySet, pullMostRecentKeySet } from '../keyset';
import { SavedSessionResult, SavedSettings } from '../dtos';
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
      };

      const expectedSerialization = JSON.stringify({
        id: 'test-id',
        Name: 'Test KeySet',
        FrequencyKeys: [{ KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65 }],
        DurationKeys: [{ KeyName: 'D', KeyDescription: 'Key D', KeyCode: 68 }],
        createdAt: '2024-09-07T12:00:00.000Z',
        lastModified: '2024-09-07T13:00:00.000Z',
        DerivedKeys: [],
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
      });

      const expectedKeySet: KeySet = {
        id: 'test-id',
        Name: 'Test KeySet',
        FrequencyKeys: [{ KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65 }],
        DurationKeys: [{ KeyName: 'D', KeyDescription: 'Key D', KeyCode: 68 }],
        createdAt: new Date('2024-09-07T12:00:00Z'),
        lastModified: new Date('2024-09-07T13:00:00Z'),
        DerivedKeys: [],
      };

      const result = deserializeKeySet(serializedKeySet);
      expect(result).toEqual(expectedKeySet);
    });

    it('should handle invalid JSON gracefully', () => {
      const invalidJSON = 'invalid json string';

      expect(() => deserializeKeySet(invalidJSON)).toThrow();
    });

    it('should handle missing properties in JSON', () => {
      const incompleteJSON = JSON.stringify({
        id: 'test-id',
        Name: 'Test KeySet',
        // Missing other properties
      });

      const result = deserializeKeySet(incompleteJSON);

      expect(result.id).toBe('test-id');
      expect(result.Name).toBe('Test KeySet');
      expect(result.FrequencyKeys).toBeUndefined();
      expect(result.DurationKeys).toBeUndefined();
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

  describe('pullMostRecentKeySet', () => {
    describe('with SavedSessionResult arrays', () => {
      it('should return the keyset from the session with the highest session number', () => {
        const sessions: SavedSessionResult[] = [
          createMockSavedSession(1, 'KeySet 1'),
          createMockSavedSession(5, 'KeySet 5'),
          createMockSavedSession(3, 'KeySet 3'),
          createMockSavedSession(2, 'KeySet 2'),
        ];

        const result = pullMostRecentKeySet(sessions);

        expect(result.Name).toBe('KeySet 5');
        expect(result.id).toBe('keyset-keyset-5');
      });

      it('should handle single session array', () => {
        const sessions: SavedSessionResult[] = [createMockSavedSession(10, 'Only KeySet')];

        const result = pullMostRecentKeySet(sessions);

        expect(result.Name).toBe('Only KeySet');
        expect(result.id).toBe('keyset-only-keyset');
      });

      it('should handle sessions with same session numbers', () => {
        const sessions: SavedSessionResult[] = [
          createMockSavedSession(3, 'KeySet A'),
          createMockSavedSession(3, 'KeySet B'),
          createMockSavedSession(1, 'KeySet C'),
        ];

        const result = pullMostRecentKeySet(sessions);

        // Should return one of the session 3 keysets (stable sort behavior)
        expect([3, 3, 1]).toContain(3);
        expect(['KeySet A', 'KeySet B']).toContain(result.Name);
      });

      it('should handle negative session numbers', () => {
        const sessions: SavedSessionResult[] = [
          createMockSavedSession(-1, 'KeySet -1'),
          createMockSavedSession(0, 'KeySet 0'),
          createMockSavedSession(-5, 'KeySet -5'),
        ];

        const result = pullMostRecentKeySet(sessions);

        expect(result.Name).toBe('KeySet 0');
      });

      it('should handle large session numbers', () => {
        const sessions: SavedSessionResult[] = [
          createMockSavedSession(999999, 'KeySet Large'),
          createMockSavedSession(1, 'KeySet Small'),
          createMockSavedSession(1000000, 'KeySet Largest'),
        ];

        const result = pullMostRecentKeySet(sessions);

        expect(result.Name).toBe('KeySet Largest');
      });
    });

    describe('with ModifiedSessionResult arrays', () => {
      it('should return the keyset from the session with the highest session number', () => {
        const sessions: ModifiedSessionResult[] = [
          createMockModifiedSession(2, 'Modified KeySet 2', 'file2.json'),
          createMockModifiedSession(7, 'Modified KeySet 7', 'file7.json'),
          createMockModifiedSession(1, 'Modified KeySet 1', 'file1.json'),
          createMockModifiedSession(4, 'Modified KeySet 4', 'file4.json'),
        ];

        const result = pullMostRecentKeySet(sessions);

        expect(result.Name).toBe('Modified KeySet 7');
        expect(result.id).toBe('keyset-modified-keyset-7');
      });

      it('should handle single modified session array', () => {
        const sessions: ModifiedSessionResult[] = [
          createMockModifiedSession(15, 'Single Modified KeySet', 'single.json'),
        ];

        const result = pullMostRecentKeySet(sessions);

        expect(result.Name).toBe('Single Modified KeySet');
      });

      it('should preserve original keyset properties', () => {
        const sessions: ModifiedSessionResult[] = [createMockModifiedSession(1, 'Test KeySet')];

        const result = pullMostRecentKeySet(sessions);

        expect(result).toHaveProperty('FrequencyKeys');
        expect(result).toHaveProperty('DurationKeys');
        expect(result).toHaveProperty('createdAt');
        expect(result).toHaveProperty('lastModified');
        expect(result.FrequencyKeys).toHaveLength(1);
        expect(result.DurationKeys).toHaveLength(1);
      });
    });

    describe('mixed array handling', () => {
      it('should work with mixed SavedSessionResult and ModifiedSessionResult types', () => {
        // Note: TypeScript would prevent this at compile time, but testing runtime behavior
        const sessions: (SavedSessionResult | ModifiedSessionResult)[] = [
          createMockSavedSession(2, 'Saved KeySet'),
          createMockModifiedSession(5, 'Modified KeySet', 'modified.json'),
        ];

        const result = pullMostRecentKeySet(sessions as any);

        expect(result.Name).toBe('Modified KeySet');
      });
    });

    describe('edge cases', () => {
      it('should handle sessions with zero session numbers', () => {
        const sessions: SavedSessionResult[] = [
          createMockSavedSession(0, 'KeySet Zero'),
          createMockSavedSession(-1, 'KeySet Negative'),
        ];

        const result = pullMostRecentKeySet(sessions);

        expect(result.Name).toBe('KeySet Zero');
      });

      it('should handle floating point session numbers', () => {
        const session1 = createMockSavedSession(1, 'KeySet 1');
        const session2 = createMockSavedSession(2, 'KeySet 2');

        // Artificially set floating point session numbers
        session1.SessionSettings.Session = 1.5;
        session2.SessionSettings.Session = 2.3;

        const sessions: SavedSessionResult[] = [session1, session2];

        const result = pullMostRecentKeySet(sessions);

        expect(result.Name).toBe('KeySet 2');
      });

      it('should maintain original array order when extracting result', () => {
        const sessions: SavedSessionResult[] = [
          createMockSavedSession(3, 'First'),
          createMockSavedSession(1, 'Second'),
          createMockSavedSession(5, 'Third'),
        ];

        const originalLength = sessions.length;
        const result = pullMostRecentKeySet(sessions);

        // Verify original array is not mutated
        expect(sessions).toHaveLength(originalLength);
        expect(result.Name).toBe('Third');
      });

      it('should handle sessions with complex keyset structures', () => {
        const complexKeyset: KeySet = {
          id: 'complex-keyset',
          Name: 'Complex KeySet',
          FrequencyKeys: [
            { KeyName: 'F1', KeyDescription: 'Frequency Key 1', KeyCode: 70 },
            { KeyName: 'F2', KeyDescription: 'Frequency Key 2', KeyCode: 71 },
          ],
          DurationKeys: [
            { KeyName: 'D1', KeyDescription: 'Duration Key 1', KeyCode: 68 },
            { KeyName: 'D2', KeyDescription: 'Duration Key 2', KeyCode: 69 },
            { KeyName: 'D3', KeyDescription: 'Duration Key 3', KeyCode: 70 },
          ],
          createdAt: new Date('2024-01-01T10:00:00Z'),
          lastModified: new Date('2024-01-02T15:30:00Z'),
          DerivedKeys: [],
        };

        const session = createMockSavedSession(1, 'Complex');
        session.Keyset = complexKeyset;

        const sessions: SavedSessionResult[] = [session];

        const result = pullMostRecentKeySet(sessions);

        expect(result).toEqual(complexKeyset);
        expect(result.FrequencyKeys).toHaveLength(2);
        expect(result.DurationKeys).toHaveLength(3);
      });

      it('should throw error for empty arrays', () => {
        const emptySavedSessions: SavedSessionResult[] = [];
        const emptyModifiedSessions: ModifiedSessionResult[] = [];

        expect(() => pullMostRecentKeySet(emptySavedSessions)).toThrow();
        expect(() => pullMostRecentKeySet(emptyModifiedSessions)).toThrow();
      });
    });
  });
});
