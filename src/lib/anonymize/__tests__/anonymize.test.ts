import { describe, it, expect } from 'vitest';
import { SavedSessionResult } from '@/lib/dtos/session-results';
import { SavedSettings } from '@/lib/dtos/session-settings';
import { KeySet, KeySetInstance } from '@/types/keyset/core';
import { KeyManageType } from '@/types/timing';
import { createAnonymizationContext, anonymizeSessionResult, anonymizeSessionResults } from '../anonymize';

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

describe('anonymizeSessionResults', () => {
  it('preserves relative gaps between sessions after shifting to the anchor', () => {
    const keyset = createMockKeySet('2024-01-01T10:00:00Z', '2024-01-01T10:00:00Z');
    const results = [
      createMockSession({ Keyset: keyset, SessionStart: '2024-01-01T10:00:00Z', SessionEnd: '2024-01-01T10:10:00Z' }),
      createMockSession({ Keyset: keyset, SessionStart: '2024-01-03T10:00:00Z', SessionEnd: '2024-01-03T10:10:00Z' }),
    ];
    const originalGapMs = new Date(results[1].SessionStart).getTime() - new Date(results[0].SessionStart).getTime();

    const anchor = new Date('2026-01-01T00:00:00Z');
    const anonymized = anonymizeSessionResults(results, anchor);

    expect(anonymized[0].SessionStart).toBe(anchor.toISOString());
    const shiftedGapMs =
      new Date(anonymized[1].SessionStart).getTime() - new Date(anonymized[0].SessionStart).getTime();
    expect(shiftedGapMs).toBe(originalGapMs);
  });

  it('shifts KeyPress timestamps and Keyset dates by the same offset', () => {
    const results = [
      createMockSession({
        SessionStart: '2024-01-01T10:00:00Z',
        SessionEnd: '2024-01-01T10:10:00Z',
        FrequencyKeyPresses: [createMockKeyPress('2024-01-01T10:05:00Z')],
        Keyset: createMockKeySet('2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
      }),
    ];

    const anchor = new Date('2026-01-01T00:00:00Z');
    const [anonymized] = anonymizeSessionResults(results, anchor);

    const offsetMs = anchor.getTime() - new Date('2024-01-01T00:00:00Z').getTime();
    expect(anonymized.FrequencyKeyPresses[0].TimePressed).toBeInstanceOf(Date);
    expect((anonymized.FrequencyKeyPresses[0].TimePressed as Date).getTime()).toBe(
      new Date('2024-01-01T10:05:00Z').getTime() + offsetMs,
    );
    expect(anonymized.Keyset.createdAt.getTime()).toBe(new Date('2024-01-01T00:00:00Z').getTime() + offsetMs);
  });

  it('maps the same Therapist/Initials value to the identical pseudonym across files', () => {
    const results = [
      createMockSession({
        SessionSettings: { ...createMockSession().SessionSettings, Therapist: 'AB', Initials: 'CD' },
      }),
      createMockSession({
        SessionSettings: { ...createMockSession().SessionSettings, Therapist: 'AB', Initials: 'EF' },
      }),
    ];

    const anonymized = anonymizeSessionResults(results, new Date('2026-01-01T00:00:00Z'));

    expect(anonymized[0].SessionSettings.Therapist).toBe(anonymized[1].SessionSettings.Therapist);
    expect(anonymized[0].SessionSettings.Initials).not.toBe(anonymized[1].SessionSettings.Initials);
  });

  it('redacts Comments by default and preserves them when redactComments is false', () => {
    const results = [createMockSession({ Comments: 'Sensitive note about a person' })];

    const redacted = anonymizeSessionResults(results, new Date('2026-01-01T00:00:00Z'));
    expect(redacted[0].Comments).toBeUndefined();

    const preserved = anonymizeSessionResults(results, new Date('2026-01-01T00:00:00Z'), { redactComments: false });
    expect(preserved[0].Comments).toBe('Sensitive note about a person');
  });

  it('does not mutate the original results', () => {
    const results = [createMockSession()];
    const originalTherapist = results[0].SessionSettings.Therapist;

    anonymizeSessionResults(results, new Date('2026-01-01T00:00:00Z'));

    expect(results[0].SessionSettings.Therapist).toBe(originalTherapist);
  });
});

describe('createAnonymizationContext / anonymizeSessionResult', () => {
  it('builds a context reusable across anonymizeSessionResult calls', () => {
    const results = [
      createMockSession({
        SessionSettings: { ...createMockSession().SessionSettings, Therapist: 'AB', Initials: 'AB' },
      }),
    ];
    const anchor = new Date('2026-01-01T00:00:00Z');
    const context = createAnonymizationContext(results, anchor);

    const anonymized = anonymizeSessionResult(results[0], context);
    expect(anonymized.SessionSettings.Therapist).toBe('Person 001');
    expect(anonymized.SessionSettings.Initials).toBe('Person 001');
  });
});

describe('full scenario: yesterday/today primary sessions plus reliability coder sessions normalized to Jan 1 of this year', () => {
  it('anchors the earliest session exactly onto Jan 1 and shifts every timestamp across all four sessions by the same offset', () => {
    const today = new Date('2026-08-24T15:00:00Z');
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const anchor = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));

    const yesterdaySession = createMockSession({
      SessionSettings: { ...createMockSession().SessionSettings, Therapist: 'TS', Initials: 'DS' },
      SessionStart: yesterday.toISOString(),
      SessionEnd: new Date(yesterday.getTime() + 10 * 60 * 1000).toISOString(),
      FrequencyKeyPresses: [createMockKeyPress(new Date(yesterday.getTime() + 5 * 60 * 1000))],
      Keyset: createMockKeySet(yesterday.toISOString(), yesterday.toISOString()),
    });

    // A second, independent coder recording the same session for interobserver reliability; same therapist, different recorder
    const yesterdayReliSession = createMockSession({
      SessionSettings: {
        ...createMockSession().SessionSettings,
        Therapist: 'TS',
        Initials: 'RC',
        Role: 'Reliability',
      },
      SessionStart: yesterday.toISOString(),
      SessionEnd: new Date(yesterday.getTime() + 10 * 60 * 1000).toISOString(),
      FrequencyKeyPresses: [createMockKeyPress(new Date(yesterday.getTime() + 5 * 60 * 1000))],
      Keyset: createMockKeySet(yesterday.toISOString(), yesterday.toISOString()),
    });

    const todaySession = createMockSession({
      SessionSettings: { ...createMockSession().SessionSettings, Therapist: 'TS', Initials: 'DS' },
      SessionStart: today.toISOString(),
      SessionEnd: new Date(today.getTime() + 10 * 60 * 1000).toISOString(),
      FrequencyKeyPresses: [createMockKeyPress(new Date(today.getTime() + 5 * 60 * 1000))],
      Keyset: createMockKeySet(today.toISOString(), today.toISOString()),
    });

    // A second, independent coder recording the same session for interobserver reliability; same therapist, different recorder
    const todayReliSession = createMockSession({
      SessionSettings: {
        ...createMockSession().SessionSettings,
        Therapist: 'TS',
        Initials: 'RC',
        Role: 'Reliability',
      },
      SessionStart: today.toISOString(),
      SessionEnd: new Date(today.getTime() + 10 * 60 * 1000).toISOString(),
      FrequencyKeyPresses: [createMockKeyPress(new Date(today.getTime() + 5 * 60 * 1000))],
      Keyset: createMockKeySet(today.toISOString(), today.toISOString()),
    });

    const [anonymizedYesterday, anonymizedYesterdayReli, anonymizedToday, anonymizedTodayReli] =
      anonymizeSessionResults([yesterdaySession, yesterdayReliSession, todaySession, todayReliSession], anchor);
    const offsetMs = anchor.getTime() - yesterday.getTime();

    // The earliest session (yesterday) lands exactly on the anchor date
    expect(anonymizedYesterday.SessionStart).toBe(anchor.toISOString());

    // The one-day gap between the two days is preserved exactly after shifting, for both coders
    const shiftedGapMs =
      new Date(anonymizedToday.SessionStart).getTime() - new Date(anonymizedYesterday.SessionStart).getTime();
    const shiftedReliGapMs =
      new Date(anonymizedTodayReli.SessionStart).getTime() - new Date(anonymizedYesterdayReli.SessionStart).getTime();
    expect(shiftedGapMs).toBe(24 * 60 * 60 * 1000);
    expect(shiftedReliGapMs).toBe(24 * 60 * 60 * 1000);

    // Every timestamp in the "yesterday" sessions shifts by the same batch-wide offset
    expect(new Date(anonymizedYesterday.SessionEnd).getTime()).toBe(
      new Date(yesterdaySession.SessionEnd).getTime() + offsetMs,
    );
    expect((anonymizedYesterday.FrequencyKeyPresses[0].TimePressed as Date).getTime()).toBe(
      yesterday.getTime() + 5 * 60 * 1000 + offsetMs,
    );
    expect(anonymizedYesterday.Keyset.createdAt.getTime()).toBe(yesterday.getTime() + offsetMs);
    expect(anonymizedYesterday.Keyset.lastModified.getTime()).toBe(yesterday.getTime() + offsetMs);
    expect(anonymizedYesterdayReli.SessionStart).toBe(anonymizedYesterday.SessionStart);
    expect(anonymizedYesterdayReli.Keyset.createdAt.getTime()).toBe(yesterday.getTime() + offsetMs);

    // Every timestamp in the "today" sessions shifts by that same offset, not their own earliest instant
    expect(new Date(anonymizedToday.SessionEnd).getTime()).toBe(new Date(todaySession.SessionEnd).getTime() + offsetMs);
    expect((anonymizedToday.FrequencyKeyPresses[0].TimePressed as Date).getTime()).toBe(
      today.getTime() + 5 * 60 * 1000 + offsetMs,
    );
    expect(anonymizedToday.Keyset.createdAt.getTime()).toBe(today.getTime() + offsetMs);
    expect(anonymizedToday.Keyset.lastModified.getTime()).toBe(today.getTime() + offsetMs);
    expect(anonymizedTodayReli.SessionStart).toBe(anonymizedToday.SessionStart);
    expect(anonymizedTodayReli.Keyset.createdAt.getTime()).toBe(today.getTime() + offsetMs);

    // The one discrete therapist resolves to the same pseudonym on every session (never also a recorder), while the
    // primary and reliability recorders resolve to their own distinct, consistent pseudonyms across both days
    expect(anonymizedYesterday.SessionSettings.Therapist).toBe('Person 003');
    expect(anonymizedToday.SessionSettings.Therapist).toBe('Person 003');
    expect(anonymizedYesterday.SessionSettings.Initials).toBe('Person 001');
    expect(anonymizedToday.SessionSettings.Initials).toBe('Person 001');
    expect(anonymizedYesterdayReli.SessionSettings.Therapist).toBe('Person 003');
    expect(anonymizedTodayReli.SessionSettings.Therapist).toBe('Person 003');
    expect(anonymizedYesterdayReli.SessionSettings.Initials).toBe('Person 002');
    expect(anonymizedTodayReli.SessionSettings.Initials).toBe('Person 002');
    expect(anonymizedYesterdayReli.SessionSettings.Role).toBe('Reliability');
    expect(anonymizedTodayReli.SessionSettings.Role).toBe('Reliability');
  });
});
