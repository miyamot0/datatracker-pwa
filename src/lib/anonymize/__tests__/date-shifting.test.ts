import { describe, it, expect } from 'vitest';
import { SavedSessionResult } from '@/lib/dtos/session-results';
import { SavedSettings } from '@/lib/dtos/session-settings';
import { KeySet, KeySetInstance } from '@/types/keyset/core';
import { KeyManageType } from '@/types/timing';
import { toDate, shiftDateLike, findEarliestTimestamp, computeOffsetMs } from '../date-shifting';

const createMockKeySet = (createdAt: string, lastModified: string): KeySet => ({
  id: 'keyset-1',
  Name: 'Test KeySet',
  FrequencyKeys: [{ KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65 }] as KeySetInstance[],
  DurationKeys: [{ KeyName: 'D', KeyDescription: 'Key D', KeyCode: 68 }] as KeySetInstance[],
  createdAt: new Date(createdAt),
  lastModified: new Date(lastModified),
  DerivedKeys: [],
  SpecialDurationKeys: [],
  ScorableDurationKeys: [],
});

const createMockKeyPress = (timePressed: string | Date, keyName = 'A'): KeyManageType => ({
  KeyName: keyName,
  KeyCode: 65,
  KeyDescription: 'Key A',
  KeyScheduleRecording: 'Primary',
  TimePressed: timePressed instanceof Date ? timePressed : new Date(timePressed),
  TimeIntoSession: 0,
  KeyType: 'Frequency',
});

const createMockSession = (overrides: Partial<SavedSessionResult> = {}): SavedSessionResult => ({
  Keyset: createMockKeySet('2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
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

describe('toDate', () => {
  it('returns Date instances unchanged', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    expect(toDate(date)).toBe(date);
  });

  it('parses ISO strings into Date instances', () => {
    expect(toDate('2024-01-01T00:00:00Z').getTime()).toBe(new Date('2024-01-01T00:00:00Z').getTime());
  });
});

describe('shiftDateLike', () => {
  it('shifts a Date instance and returns a Date', () => {
    const shifted = shiftDateLike(new Date('2024-01-01T00:00:00Z'), 1000 * 60 * 60);
    expect(shifted).toBeInstanceOf(Date);
    expect(shifted.toISOString()).toBe('2024-01-01T01:00:00.000Z');
  });

  it('shifts an ISO string and returns an ISO string', () => {
    const shifted = shiftDateLike('2024-01-01T00:00:00Z', 1000 * 60 * 60);
    expect(typeof shifted).toBe('string');
    expect(shifted).toBe('2024-01-01T01:00:00.000Z');
  });
});

describe('findEarliestTimestamp', () => {
  it('throws when given an empty array', () => {
    expect(() => findEarliestTimestamp([])).toThrow();
  });

  it('finds the earliest SessionStart across multiple files', () => {
    const keyset = createMockKeySet('2023-01-01T00:00:00Z', '2023-01-01T00:00:00Z');
    const results = [
      createMockSession({ Keyset: keyset, SessionStart: '2024-02-01T10:00:00Z', SessionEnd: '2024-02-01T10:10:00Z' }),
      createMockSession({ Keyset: keyset, SessionStart: '2024-01-01T10:00:00Z', SessionEnd: '2024-01-01T10:10:00Z' }),
    ];

    expect(findEarliestTimestamp(results).toISOString()).toBe('2023-01-01T00:00:00.000Z');
  });

  it('finds an earliest instant buried in a keypress rather than SessionStart', () => {
    const results = [
      createMockSession({
        SessionStart: '2024-01-01T10:00:00Z',
        SessionEnd: '2024-01-01T10:10:00Z',
        FrequencyKeyPresses: [createMockKeyPress('2023-12-31T23:00:00Z')],
      }),
    ];

    expect(findEarliestTimestamp(results).toISOString()).toBe('2023-12-31T23:00:00.000Z');
  });
});

describe('computeOffsetMs', () => {
  it('computes the ms difference needed to move earliest onto the anchor', () => {
    const earliest = new Date('2024-01-01T00:00:00Z');
    const anchor = new Date('2024-06-01T00:00:00Z');
    expect(computeOffsetMs(earliest, anchor)).toBe(anchor.getTime() - earliest.getTime());
  });
});
