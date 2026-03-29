import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getUnifiedTimerValue,
  getUnifiedTimerMinutes,
  getUnifiedTimerLabel,
  getTimerSchedule,
  convertLegacyTimerType,
  createSpecialTimerType,
  identifyStrategyTimingStrategy,
} from '../calculation-helpers';
import { SessionTerminationOptions } from '@/types/terminations';
import type { SavedSessionResult } from '@/lib/dtos';
import type { KeySet } from '@/types/keyset';
import type { SessionProcessingOptions } from '../../../types/calculation';

vi.mock('@/lib/schedule-parser', () => ({
  sumDurationScoringKey: vi.fn().mockReturnValue(120),
  sumDurationSpecialKey: vi.fn().mockReturnValue(90),
}));

import { sumDurationScoringKey, sumDurationSpecialKey } from '@/lib/schedule-parser';

// ── Factories ────────────────────────────────────────────────────────────────

function makeKeyset(overrides: Partial<KeySet> = {}): KeySet {
  return {
    id: 'ks-1',
    Name: 'Test',
    FrequencyKeys: [],
    DurationKeys: [],
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
    createdAt: new Date(),
    lastModified: new Date(),
    ...overrides,
  };
}

function makeResult(overrides: Partial<SavedSessionResult> = {}): SavedSessionResult {
  return {
    TimerMain: 600,
    TimerOne: 300,
    TimerTwo: 200,
    TimerThree: 100,
    SystemKeyPresses: [],
    FrequencyKeyPresses: [],
    DurationKeyPresses: [],
    SpecialKeyTimers: {},
    SessionStart: '',
    SessionEnd: '',
    EndedEarly: false,
    Keyset: makeKeyset(),
    SessionSettings: {} as any,
    ...overrides,
  };
}

function makeOptions(timerType: any = 'Total', strategyOverride: Partial<any> = {}): SessionProcessingOptions {
  const keyset = makeKeyset();
  return {
    timer: { timerType, includeRates: false, includePercentages: false, includeBouts: false },
    strategy: { special: false, schedule: 'system', keyset, timerType, ...strategyOverride },
    keyTypes: { frequency: true, duration: true, derived: true },
    outputFormat: 'raw',
  };
}

// ── getUnifiedTimerValue ─────────────────────────────────────────────────────

describe('getUnifiedTimerValue', () => {
  beforeEach(() => {
    vi.mocked(sumDurationScoringKey).mockReturnValue(120);
    vi.mocked(sumDurationSpecialKey).mockReturnValue(90);
  });

  it('returns TimerMain for Total', () => {
    expect(getUnifiedTimerValue(makeResult(), makeOptions('Total'))).toBe(600);
  });

  it('returns TimerOne for Timer1', () => {
    expect(getUnifiedTimerValue(makeResult(), makeOptions('Timer1'))).toBe(300);
  });

  it('returns TimerTwo for Timer2', () => {
    expect(getUnifiedTimerValue(makeResult(), makeOptions('Timer2'))).toBe(200);
  });

  it('returns TimerThree for Timer3', () => {
    expect(getUnifiedTimerValue(makeResult(), makeOptions('Timer3'))).toBe(100);
  });

  it('calls sumDurationScoringKey for special duration strategy', () => {
    const result = makeResult();
    const timerType = { type: 'Special' as const, keyName: 'myKey' };
    const options: SessionProcessingOptions = {
      timer: { timerType },
      strategy: { special: true, schedule: 'duration', keyset: makeKeyset(), timerType },
      keyTypes: { frequency: true, duration: true, derived: true },
      outputFormat: 'raw',
    };
    const val = getUnifiedTimerValue(result, options);
    expect(sumDurationScoringKey).toHaveBeenCalledWith(result, 'myKey');
    expect(val).toBe(120);
  });

  it('calls sumDurationSpecialKey for special system strategy', () => {
    const result = makeResult();
    const timerType = { type: 'Special' as const, keyName: 'specialKey' };
    const options: SessionProcessingOptions = {
      timer: { timerType },
      strategy: { special: true, schedule: 'system', keyset: makeKeyset(), timerType },
      keyTypes: { frequency: true, duration: true, derived: true },
      outputFormat: 'raw',
    };
    const val = getUnifiedTimerValue(result, options);
    expect(sumDurationSpecialKey).toHaveBeenCalledWith(result, 'specialKey');
    expect(val).toBe(90);
  });

  it('throws for invalid timer type', () => {
    expect(() => getUnifiedTimerValue(makeResult(), makeOptions('BadTimer' as any))).toThrow();
  });
});

// ── getUnifiedTimerMinutes ───────────────────────────────────────────────────

describe('getUnifiedTimerMinutes', () => {
  it('returns the timer value divided by 60', () => {
    expect(getUnifiedTimerMinutes(makeResult({ TimerMain: 600 }), makeOptions('Total'))).toBe(10);
  });

  it('returns 0 when timer is 0', () => {
    expect(getUnifiedTimerMinutes(makeResult({ TimerMain: 0 }), makeOptions('Total'))).toBe(0);
  });
});

// ── getUnifiedTimerLabel ─────────────────────────────────────────────────────

describe('getUnifiedTimerLabel', () => {
  it('returns "Session" for Total', () => {
    expect(getUnifiedTimerLabel(makeOptions('Total'))).toBe('Session');
  });

  it('returns "Timer #1" for Timer1', () => {
    expect(getUnifiedTimerLabel(makeOptions('Timer1'))).toBe('Timer #1');
  });

  it('returns "Timer #2" for Timer2', () => {
    expect(getUnifiedTimerLabel(makeOptions('Timer2'))).toBe('Timer #2');
  });

  it('returns "Timer #3" for Timer3', () => {
    expect(getUnifiedTimerLabel(makeOptions('Timer3'))).toBe('Timer #3');
  });

  it('returns scoring label for special duration strategy', () => {
    const timerType = { type: 'Special' as const, keyName: 'myKey' };
    const options: SessionProcessingOptions = {
      timer: { timerType },
      strategy: { special: true, schedule: 'duration', keyset: makeKeyset(), timerType },
      keyTypes: { frequency: true, duration: true, derived: true },
      outputFormat: 'raw',
    };
    expect(getUnifiedTimerLabel(options)).toBe('myKey (Scoring)');
  });

  it('returns timing label for special system strategy', () => {
    const timerType = { type: 'Special' as const, keyName: 'myKey' };
    const options: SessionProcessingOptions = {
      timer: { timerType },
      strategy: { special: true, schedule: 'system', keyset: makeKeyset(), timerType },
      keyTypes: { frequency: true, duration: true, derived: true },
      outputFormat: 'raw',
    };
    expect(getUnifiedTimerLabel(options)).toBe('myKey (Timing)');
  });

  it('throws for invalid timer type', () => {
    expect(() => getUnifiedTimerLabel(makeOptions('BadTimer' as any))).toThrow();
  });
});

// ── getTimerSchedule ─────────────────────────────────────────────────────────

describe('getTimerSchedule', () => {
  it('returns Primary for Timer1', () => {
    expect(getTimerSchedule('Timer1')).toBe('Primary');
  });

  it('returns Secondary for Timer2', () => {
    expect(getTimerSchedule('Timer2')).toBe('Secondary');
  });

  it('returns Tertiary for Timer3', () => {
    expect(getTimerSchedule('Timer3')).toBe('Tertiary');
  });

  it('returns Primary for Total (default)', () => {
    expect(getTimerSchedule('Total')).toBe('Primary');
  });

  it('returns Special for Special object type', () => {
    expect(getTimerSchedule({ type: 'Special', keyName: 'key' })).toBe('Special');
  });
});

// ── convertLegacyTimerType ────────────────────────────────────────────────────

describe('convertLegacyTimerType', () => {
  const keyset = makeKeyset({
    SpecialDurationKeys: [{ KeyName: 'specialTimer', KeyDescription: 'My Special Timer', KeyCode: 10 }],
    ScorableDurationKeys: [{ KeyName: 'scoringKey', KeyDescription: 'My Scoring Key', KeyCode: 20 }],
  });

  it('converts TimerMain to Total', () => {
    expect(convertLegacyTimerType(SessionTerminationOptions.TimerMain, keyset)).toBe('Total');
  });

  it('converts Timer1 to Timer1', () => {
    expect(convertLegacyTimerType(SessionTerminationOptions.Timer1, keyset)).toBe('Timer1');
  });

  it('converts Timer2 to Timer2', () => {
    expect(convertLegacyTimerType(SessionTerminationOptions.Timer2, keyset)).toBe('Timer2');
  });

  it('converts Timer3 to Timer3', () => {
    expect(convertLegacyTimerType(SessionTerminationOptions.Timer3, keyset)).toBe('Timer3');
  });

  it('converts string matching SpecialDurationKey description to Special type', () => {
    const result = convertLegacyTimerType('prefix My Special Timer', keyset);
    expect(result).toEqual({ type: 'Special', keyName: 'specialTimer' });
  });

  it('converts string matching ScorableDurationKey description to Special type', () => {
    const result = convertLegacyTimerType('prefix My Scoring Key', keyset);
    expect(result).toEqual({ type: 'Special', keyName: 'scoringKey' });
  });

  it('returns Total for an unmatched string', () => {
    expect(convertLegacyTimerType('unknown value xyz', keyset)).toBe('Total');
  });
});

// ── createSpecialTimerType ────────────────────────────────────────────────────

describe('createSpecialTimerType', () => {
  it('creates a Special timer type object', () => {
    expect(createSpecialTimerType('myKey')).toEqual({ type: 'Special', keyName: 'myKey' });
  });

  it('preserves the exact key name supplied', () => {
    expect(createSpecialTimerType('anotherKey')).toEqual({ type: 'Special', keyName: 'anotherKey' });
  });
});

// ── identifyStrategyTimingStrategy ───────────────────────────────────────────

describe('identifyStrategyTimingStrategy', () => {
  it('returns non-special strategy for simple timer types', () => {
    const keyset = makeKeyset();
    const result = identifyStrategyTimingStrategy(keyset, 'Total');
    expect(result.special).toBe(false);
    expect(result.schedule).toBe('system');
    expect(result.timerType).toBe('Total');
  });

  it('is non-special for Timer1, Timer2, Timer3', () => {
    const keyset = makeKeyset();
    for (const t of ['Timer1', 'Timer2', 'Timer3'] as const) {
      const result = identifyStrategyTimingStrategy(keyset, t);
      expect(result.special).toBe(false);
    }
  });

  it('returns system-schedule special strategy for SpecialDurationKey', () => {
    const keyset = makeKeyset({
      SpecialDurationKeys: [{ KeyName: 'specialTimer', KeyDescription: 'Special', KeyCode: 1 }],
    });
    const timerType = { type: 'Special' as const, keyName: 'specialTimer' };
    const result = identifyStrategyTimingStrategy(keyset, timerType);
    expect(result.special).toBe(true);
    expect(result.schedule).toBe('system');
    expect(result.specialKeyName).toBe('specialTimer');
  });

  it('returns duration-schedule special strategy for ScorableDurationKey', () => {
    const keyset = makeKeyset({
      ScorableDurationKeys: [{ KeyName: 'scoringKey', KeyDescription: 'Scoring', KeyCode: 2 }],
    });
    const timerType = { type: 'Special' as const, keyName: 'scoringKey' };
    const result = identifyStrategyTimingStrategy(keyset, timerType);
    expect(result.special).toBe(true);
    expect(result.schedule).toBe('duration');
    expect(result.specialKeyName).toBe('scoringKey');
  });

  it('throws when Special key name is not found in either key list', () => {
    const keyset = makeKeyset();
    const timerType = { type: 'Special' as const, keyName: 'missing' };
    expect(() => identifyStrategyTimingStrategy(keyset, timerType)).toThrow();
  });
});
