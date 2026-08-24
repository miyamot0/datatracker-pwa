import { describe, it, expect } from 'vitest';
import { SavedSessionResult } from '@/lib/dtos/session-results';
import { SavedSettings } from '@/lib/dtos/session-settings';
import { KeySet, KeySetInstance } from '@/types/keyset/core';
import { buildPersonRoster, resolvePersonPseudonym } from '../name-shifting';

const createMockKeySet = (): KeySet => ({
  id: 'keyset-1',
  Name: 'Test KeySet',
  FrequencyKeys: [{ KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65 }] as KeySetInstance[],
  DurationKeys: [{ KeyName: 'D', KeyDescription: 'Key D', KeyCode: 68 }] as KeySetInstance[],
  createdAt: new Date('2024-01-01T00:00:00Z'),
  lastModified: new Date('2024-01-01T00:00:00Z'),
  DerivedKeys: [],
  SpecialDurationKeys: [],
  ScorableDurationKeys: [],
});

const createMockSession = (overrides: Partial<SavedSessionResult> = {}): SavedSessionResult => ({
  Keyset: createMockKeySet(),
  SessionSettings: {
    Session: 1,
    Therapist: 'Jane Doe',
    Condition: 'Baseline',
    KeySet: 'test-keyset',
    TimerOption: 'End on Timer #1',
    Initials: 'JD',
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
  ...overrides,
});

describe('buildPersonRoster', () => {
  it('sorts unique values alphabetically and numbers them sequentially', () => {
    const results = [
      createMockSession({
        SessionSettings: { ...createMockSession().SessionSettings, Therapist: 'Zoe', Initials: 'AB' },
      }),
      createMockSession({
        SessionSettings: { ...createMockSession().SessionSettings, Therapist: 'Amy', Initials: 'CD' },
      }),
    ];

    const roster = buildPersonRoster(results);

    expect(roster.get('AB')).toBe('Person 001');
    expect(roster.get('Amy')).toBe('Person 002');
    expect(roster.get('CD')).toBe('Person 003');
    expect(roster.get('Zoe')).toBe('Person 004');
  });

  it('shares one roster entry when the same value appears as both Therapist and Initials', () => {
    const results = [
      createMockSession({
        SessionSettings: { ...createMockSession().SessionSettings, Therapist: 'AB', Initials: 'AB' },
      }),
    ];

    const roster = buildPersonRoster(results);
    expect(roster.size).toBe(1);
    expect(roster.get('AB')).toBe('Person 001');
  });

  it('ignores blank values', () => {
    const results = [
      createMockSession({ SessionSettings: { ...createMockSession().SessionSettings, Therapist: '', Initials: 'AB' } }),
    ];

    const roster = buildPersonRoster(results);
    expect(roster.size).toBe(1);
  });
});

describe('resolvePersonPseudonym', () => {
  it('passes through blank values unchanged', () => {
    expect(resolvePersonPseudonym('', new Map())).toBe('');
  });

  it('resolves a known value to its pseudonym', () => {
    const roster = new Map([['AB', 'Person 001']]);
    expect(resolvePersonPseudonym('AB', roster)).toBe('Person 001');
  });
});
