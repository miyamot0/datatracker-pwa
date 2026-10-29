import { KeySet, KeySetInstance } from '../../types/keyset/core';
import { v4 as uuidv4 } from '@/lib/uuid';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createNewKeySet, deserializeKeySet, pullMostRecentSession, serializeKeySet } from '../keyset';
import { SavedSessionResult } from '../dtos/session-results';
import { SavedSettings } from '../dtos/session-settings';
import { ModifiedSessionResult } from '@/types/storage';
import { Mock, vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/uuid', () => ({
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

    it('should keep an editor-shaped DerivedKey with field sources and steps', () => {
      const field = { KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65, Value: 3, Tag: 'field.Key A' };
      const derived = {
        id: 'derived-2',
        name: 'Doubled',
        value: 3,
        initial: { type: 'field', field },
        fields: [field],
        steps: [
          { id: 'step-1', operation: 'multiply', operand: { type: 'constant', value: 2 } },
          { id: 'step-2', operation: 'add', operand: { type: 'field', field } },
        ],
      };

      const result = deserializeKeySet(JSON.stringify({ id: 'test-id', Name: 'Test KeySet', DerivedKeys: [derived] }));

      expect(result.DerivedKeys).toEqual([derived]);
    });

    it('should keep valid DerivedKeys and keep malformed ones unchanged', () => {
      const validDerived = {
        id: 'derived-1',
        name: 'Derived',
        value: 0,
        initial: { type: 'constant', value: 0 },
        fields: [],
        steps: [],
      };
      const malformed = { id: 'missing-fields' };
      const json = JSON.stringify({
        id: 'test-id',
        Name: 'Test KeySet',
        DerivedKeys: [validDerived, malformed, 'junk'],
      });

      const result = deserializeKeySet(json);

      expect(result.DerivedKeys).toEqual([validDerived, malformed, 'junk']);
    });

    it('should keep a DerivedKey whose field entry lacks Value or Tag, so saving does not delete it', () => {
      const field = { KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65, Value: 1, Tag: 'field.Key A' };
      const { Tag: _tag, ...fieldWithoutTag } = field;
      const base = {
        id: 'derived-3',
        name: 'Derived',
        value: 0,
        initial: { type: 'field', field },
        fields: [field],
        steps: [],
      };
      const unmatched = { ...base, fields: [fieldWithoutTag] };

      const result = deserializeKeySet(
        JSON.stringify({ id: 'test-id', Name: 'Test KeySet', DerivedKeys: [unmatched] }),
      );

      expect(result.DerivedKeys).toEqual([unmatched]);
    });

    it('should load the demo DerivedKeys without dropping any entries', () => {
      const demoPath = resolve(
        process.cwd(),
        'demo-data/Evaluation Study/Participant 001/FC Treatment Evaluation.json',
      );
      const demo = JSON.parse(readFileSync(demoPath, 'utf8'));

      const result = deserializeKeySet(JSON.stringify(demo));

      expect(result.DerivedKeys).toHaveLength(2);
      expect(result.DerivedKeys).toEqual(demo.DerivedKeys);
      expect(result.DerivedKeys.map((d) => d.name)).toEqual(['CTB', 'Comply PCT']);
      expect(result.DerivedKeys[1].steps.map((s) => [s.operation, s.operand.type])).toEqual([
        ['divide', 'field'],
        ['multiply', 'constant'],
      ]);
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

  describe('serializeKeySet fallbacks', () => {
    it('writes empty lists when the optional key lists are absent', () => {
      const keyset = createMockKeySet('Sparse') as Partial<KeySet>;
      delete keyset.DerivedKeys;
      delete keyset.SpecialDurationKeys;
      delete keyset.ScorableDurationKeys;

      const parsed = JSON.parse(serializeKeySet(keyset as KeySet));

      expect(parsed.DerivedKeys).toEqual([]);
      expect(parsed.SpecialDurationKeys).toEqual([]);
      expect(parsed.ScorableDurationKeys).toEqual([]);
    });
  });

  describe('pullMostRecentSession', () => {
    it('returns the saved session with the highest session number', () => {
      const sessions = [createMockSavedSession(2), createMockSavedSession(7), createMockSavedSession(4)];
      const seven = sessions[1];

      const latest = pullMostRecentSession(sessions);

      expect(latest.SessionSettings.Session).toBe(7);
      expect(latest).toBe(seven);
    });

    it('returns the modified session with the highest session number', () => {
      const sessions = [createMockModifiedSession(3, 'A', 'a.json'), createMockModifiedSession(1, 'A', 'b.json')];

      const latest = pullMostRecentSession(sessions);

      expect(latest.SessionSettings.Session).toBe(3);
      expect(latest).toEqual(expect.objectContaining({ Filename: 'a.json' }));
    });

    it('returns the only session when given a single item', () => {
      const only = createMockSavedSession(5);
      expect(pullMostRecentSession([only])).toBe(only);
    });
  });
});
