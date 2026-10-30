import { describe, it, expect } from 'vitest';
import { parseSavedSessionResult } from '../dtos/session-results';

const validResult = () => ({
  Keyset: { id: 'ks', Name: 'KeySet' },
  SessionSettings: { Session: 2 },
  SystemKeyPresses: [{ KeyName: 'A', KeyCode: 65 }],
  FrequencyKeyPresses: [],
  DurationKeyPresses: [],
  SessionStart: '2024-01-01T00:00:00.000Z',
  SessionEnd: '2024-01-01T00:10:00.000Z',
  EndedEarly: false,
  TimerMain: 600,
  TimerOne: 1,
  TimerTwo: 2,
  TimerThree: 3,
  SpecialKeyTimers: { Space: 4 },
});

describe('parseSavedSessionResult', () => {
  it('returns the session for a valid result', () => {
    const result = parseSavedSessionResult(validResult());

    expect(result).not.toBeNull();
    expect(result?.SystemKeyPresses).toEqual([{ KeyName: 'A', KeyCode: 65 }]);
    expect(result?.TimerMain).toBe(600);
    expect(result?.SpecialKeyTimers).toEqual({ Space: 4 });
  });

  it('returns null for non-object input', () => {
    expect(parseSavedSessionResult(null)).toBeNull();
    expect(parseSavedSessionResult('text')).toBeNull();
    expect(parseSavedSessionResult([])).toBeNull();
  });

  it('returns null when SessionSettings or Keyset is missing or not an object', () => {
    const { SessionSettings: _settings, ...noSettings } = validResult();
    const { Keyset: _keyset, ...noKeyset } = validResult();

    expect(parseSavedSessionResult(noSettings)).toBeNull();
    expect(parseSavedSessionResult(noKeyset)).toBeNull();
    expect(parseSavedSessionResult({ ...validResult(), SessionSettings: 'bad' })).toBeNull();
    expect(parseSavedSessionResult({ ...validResult(), Keyset: 42 })).toBeNull();
  });

  it('keeps the numeric session number from SessionSettings', () => {
    const result = parseSavedSessionResult({ ...validResult(), SessionSettings: { Session: 12, KeySet: 'x' } });

    expect(result?.SessionSettings.Session).toBe(12);
    expect(result?.SessionSettings).toMatchObject({ KeySet: 'x' });
  });

  it('returns null when Session is missing or not a number', () => {
    expect(parseSavedSessionResult({ ...validResult(), SessionSettings: {} })).toBeNull();
    expect(parseSavedSessionResult({ ...validResult(), SessionSettings: { Session: '2024-01-01' } })).toBeNull();
    expect(parseSavedSessionResult({ ...validResult(), SessionSettings: { Session: null } })).toBeNull();
  });

  it('drops malformed key press entries individually and keeps valid ones', () => {
    const result = parseSavedSessionResult({
      ...validResult(),
      SystemKeyPresses: [{ KeyName: 'A', KeyCode: 65 }, { KeyName: 'B' }, 'junk', null],
      FrequencyKeyPresses: 'not-a-list',
    });

    expect(result?.SystemKeyPresses).toEqual([{ KeyName: 'A', KeyCode: 65 }]);
    expect(result?.FrequencyKeyPresses).toEqual([]);
  });

  it('falls back to neutral defaults for bad scalar fields without discarding the session', () => {
    const result = parseSavedSessionResult({
      ...validResult(),
      TimerMain: 'soon',
      EndedEarly: 'yes',
      SessionStart: 12,
      SpecialKeyTimers: { Space: 'x' },
    });

    expect(result).not.toBeNull();
    expect(result?.TimerMain).toBe(0);
    expect(result?.EndedEarly).toBe(false);
    expect(result?.SessionStart).toBe('');
    expect(result?.SpecialKeyTimers).toEqual({});
    expect(result?.TimerOne).toBe(1);
  });
});
