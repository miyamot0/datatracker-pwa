import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processFrequencyKeys } from '@/lib/calculations/calculation-frequency';
import type { SavedSessionResult } from '@/lib/dtos';
import type { KeySet } from '@/types/keyset';
import type { SessionProcessingOptions } from '../../../types/calculation';

vi.mock('@/lib/schedule-parser', () => ({
  walkSessionFrequencyKey: vi.fn(),
  sumDurationScoringKey: vi.fn().mockReturnValue(120),
  sumDurationSpecialKey: vi.fn().mockReturnValue(90),
}));

import { walkSessionFrequencyKey } from '@/lib/schedule-parser';

const mockWalk = vi.mocked(walkSessionFrequencyKey);

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
    timer: { timerType, includeRates: false },
    strategy: { special: false, schedule: 'system', keyset, timerType, ...strategyOverride },
    keyTypes: { frequency: true, duration: true, derived: true },
    outputFormat: 'raw',
  };
}

function walkReturn(value: number, keyName = 'Key', schedule = 'Primary') {
  return { Value: value, Bouts: -1, KeyName: keyName, KeyDescription: keyName, Schedule: schedule };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('processFrequencyKeys', () => {
  beforeEach(() => {
    mockWalk.mockReset();
  });

  // ── Empty keys ─────────────────────────────────────────────────────────────

  it('returns empty array when FrequencyKeys is empty', () => {
    const keyset = makeKeyset({ FrequencyKeys: [] });
    expect(processFrequencyKeys(makeResult(), keyset, makeOptions())).toEqual([]);
    expect(mockWalk).not.toHaveBeenCalled();
  });

  // ── Total timer type ───────────────────────────────────────────────────────

  it('sums Primary + Secondary + Tertiary counts for Total timer type', () => {
    const keyset = makeKeyset({
      FrequencyKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }],
    });
    mockWalk
      .mockReturnValueOnce(walkReturn(3, 'KeyA', 'Primary'))
      .mockReturnValueOnce(walkReturn(2, 'KeyA', 'Secondary'))
      .mockReturnValueOnce(walkReturn(1, 'KeyA', 'Tertiary'));

    const results = processFrequencyKeys(makeResult(), keyset, makeOptions('Total'));
    expect(results).toHaveLength(1);
    expect(results[0].rawValue).toBe(6);
  });

  it('calls walk for Primary, Secondary, and Tertiary schedules for Total', () => {
    const keyset = makeKeyset({
      FrequencyKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }],
    });
    mockWalk.mockReturnValue(walkReturn(0));

    processFrequencyKeys(makeResult(), keyset, makeOptions('Total'));

    expect(mockWalk).toHaveBeenCalledTimes(3);
    expect(mockWalk).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      'Primary',
      expect.objectContaining({ KeyName: 'KeyA' }),
    );
    expect(mockWalk).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      'Secondary',
      expect.objectContaining({ KeyName: 'KeyA' }),
    );
    expect(mockWalk).toHaveBeenNthCalledWith(
      3,
      expect.anything(),
      'Tertiary',
      expect.objectContaining({ KeyName: 'KeyA' }),
    );
  });

  // ── Specific timer types ───────────────────────────────────────────────────

  it('uses Primary schedule for Timer1', () => {
    const keyset = makeKeyset({ FrequencyKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    mockWalk.mockReturnValueOnce(walkReturn(5, 'KeyA', 'Primary'));

    const results = processFrequencyKeys(makeResult(), keyset, makeOptions('Timer1'));

    expect(mockWalk).toHaveBeenCalledTimes(1);
    expect(mockWalk).toHaveBeenCalledWith(expect.anything(), 'Primary', expect.objectContaining({ KeyName: 'KeyA' }));
    expect(results[0].rawValue).toBe(5);
  });

  it('uses Secondary schedule for Timer2', () => {
    const keyset = makeKeyset({ FrequencyKeys: [{ KeyName: 'KeyB', KeyDescription: 'Key B', KeyCode: 2 }] });
    mockWalk.mockReturnValueOnce(walkReturn(4, 'KeyB', 'Secondary'));

    const results = processFrequencyKeys(makeResult(), keyset, makeOptions('Timer2'));

    expect(mockWalk).toHaveBeenCalledWith(expect.anything(), 'Secondary', expect.objectContaining({ KeyName: 'KeyB' }));
    expect(results[0].rawValue).toBe(4);
  });

  it('uses Tertiary schedule for Timer3', () => {
    const keyset = makeKeyset({ FrequencyKeys: [{ KeyName: 'KeyC', KeyDescription: 'Key C', KeyCode: 3 }] });
    mockWalk.mockReturnValueOnce(walkReturn(7, 'KeyC', 'Tertiary'));

    const results = processFrequencyKeys(makeResult(), keyset, makeOptions('Timer3'));

    expect(mockWalk).toHaveBeenCalledWith(expect.anything(), 'Tertiary', expect.objectContaining({ KeyName: 'KeyC' }));
    expect(results[0].rawValue).toBe(7);
  });

  // ── Special strategies ─────────────────────────────────────────────────────

  it('uses Special schedule with strategy for special duration strategy', () => {
    const keyset = makeKeyset({ FrequencyKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    const timerType = { type: 'Special' as const, keyName: 'specialKey' };
    const strategy = { special: true, schedule: 'duration' as const, keyset, timerType, specialKeyName: 'specialKey' };
    const options: SessionProcessingOptions = {
      timer: { timerType, includeRates: false },
      strategy,
      keyTypes: { frequency: true, duration: true, derived: true },
      outputFormat: 'raw',
    };

    mockWalk.mockReturnValueOnce(walkReturn(8, 'KeyA', 'Special'));

    const results = processFrequencyKeys(makeResult(), keyset, options);

    expect(mockWalk).toHaveBeenCalledWith(
      expect.anything(),
      'Special',
      expect.objectContaining({ KeyName: 'KeyA' }),
      strategy,
    );
    expect(results[0].rawValue).toBe(8);
  });

  it('uses Special schedule with strategy for special system strategy', () => {
    const keyset = makeKeyset({ FrequencyKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    const timerType = { type: 'Special' as const, keyName: 'systemKey' };
    const strategy = { special: true, schedule: 'system' as const, keyset, timerType, specialKeyName: 'systemKey' };
    const options: SessionProcessingOptions = {
      timer: { timerType, includeRates: false },
      strategy,
      keyTypes: { frequency: true, duration: true, derived: true },
      outputFormat: 'raw',
    };

    mockWalk.mockReturnValueOnce(walkReturn(9, 'KeyA', 'Special'));

    const results = processFrequencyKeys(makeResult(), keyset, options);

    expect(mockWalk).toHaveBeenCalledWith(
      expect.anything(),
      'Special',
      expect.objectContaining({ KeyName: 'KeyA' }),
      strategy,
    );
    expect(results[0].rawValue).toBe(9);
  });

  // ── Rate calculation ───────────────────────────────────────────────────────

  it('calculates rate per minute when includeRates is true and timerMinutes > 0', () => {
    const keyset = makeKeyset({ FrequencyKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    const result = makeResult({ TimerMain: 120 }); // 2 minutes
    const options: SessionProcessingOptions = {
      timer: { timerType: 'Total', includeRates: true },
      strategy: { special: false, schedule: 'system', keyset, timerType: 'Total' },
      keyTypes: { frequency: true, duration: true, derived: true },
      outputFormat: 'raw',
    };

    mockWalk.mockReturnValueOnce(walkReturn(10)).mockReturnValueOnce(walkReturn(0)).mockReturnValueOnce(walkReturn(0));

    const results = processFrequencyKeys(result, keyset, options);
    expect(results[0].rate).toBe(5); // 10 events / 2 minutes
  });

  it('does not set rate property when includeRates is false', () => {
    const keyset = makeKeyset({ FrequencyKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    mockWalk.mockReturnValueOnce(walkReturn(10)).mockReturnValueOnce(walkReturn(0)).mockReturnValueOnce(walkReturn(0));

    const results = processFrequencyKeys(makeResult(), keyset, makeOptions('Total'));
    expect(results[0].rate).toBeUndefined();
  });

  it('does not set rate property when timerMinutes is 0', () => {
    const keyset = makeKeyset({ FrequencyKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    const result = makeResult({ TimerMain: 0 });
    const options: SessionProcessingOptions = {
      timer: { timerType: 'Total', includeRates: true },
      strategy: { special: false, schedule: 'system', keyset, timerType: 'Total' },
      keyTypes: { frequency: true, duration: true, derived: true },
      outputFormat: 'raw',
    };

    mockWalk.mockReturnValueOnce(walkReturn(10)).mockReturnValueOnce(walkReturn(0)).mockReturnValueOnce(walkReturn(0));

    const results = processFrequencyKeys(result, keyset, options);
    expect(results[0].rate).toBeUndefined();
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  it('throws for an invalid non-special timer type', () => {
    const keyset = makeKeyset({ FrequencyKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    expect(() => processFrequencyKeys(makeResult(), keyset, makeOptions('BadTimer' as any))).toThrow(
      'Invalid timer type',
    );
  });

  // ── Key metadata ───────────────────────────────────────────────────────────

  it('populates correct key metadata on each result', () => {
    const keyset = makeKeyset({
      FrequencyKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A Description', KeyCode: 42 }],
    });
    mockWalk.mockReturnValueOnce(walkReturn(5, 'KeyA', 'Primary'));

    const results = processFrequencyKeys(makeResult(), keyset, makeOptions('Timer1'));

    expect(results[0].keyName).toBe('KeyA');
    expect(results[0].keyDescription).toBe('Key A Description');
    expect(results[0].keyCode).toBe(42);
    expect(results[0].keyType).toBe('Frequency');
    expect(results[0].visible).toBe(true);
  });

  // ── Multiple keys ──────────────────────────────────────────────────────────

  it('processes multiple frequency keys', () => {
    const keyset = makeKeyset({
      FrequencyKeys: [
        { KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 },
        { KeyName: 'KeyB', KeyDescription: 'Key B', KeyCode: 2 },
      ],
    });
    mockWalk.mockReturnValueOnce(walkReturn(3, 'KeyA')).mockReturnValueOnce(walkReturn(7, 'KeyB'));

    const results = processFrequencyKeys(makeResult(), keyset, makeOptions('Timer1'));

    expect(results).toHaveLength(2);
    expect(results[0].rawValue).toBe(3);
    expect(results[1].rawValue).toBe(7);
  });
});
