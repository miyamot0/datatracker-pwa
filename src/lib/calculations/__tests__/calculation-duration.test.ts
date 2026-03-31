import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processDurationKeys } from '@/lib/calculations/calculation-duration';
import type { SavedSessionResult } from '@/lib/dtos';
import type { KeySet } from '@/types/keyset';
import type { SessionProcessingOptions } from '../../../types/calculation';

vi.mock('@/lib/schedule-parser', () => ({
  walkSessionDurationKeyStateAware: vi.fn(),
  sumDurationScoringKeyStateAware: vi.fn().mockReturnValue(120),
  sumDurationSpecialKeyStateAware: vi.fn().mockReturnValue(90),
}));

import { walkSessionDurationKeyStateAware } from '@/lib/schedule-parser';

const mockWalk = vi.mocked(walkSessionDurationKeyStateAware);

// -- Factories ----------------------------------------------------------------

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
    timer: { timerType, includePercentages: false, includeBouts: false },
    strategy: { special: false, schedule: 'system', keyset, timerType, ...strategyOverride },
    keyTypes: { frequency: true, duration: true, derived: true },
    outputFormat: 'raw',
  };
}

function walkReturn(value: number, bouts = 2) {
  return { Value: value, Bouts: bouts, KeyName: 'Key', KeyDescription: 'Key', Schedule: 'Primary' };
}

// -- Tests --------------------------------------------------------------------

describe('processDurationKeys', () => {
  beforeEach(() => {
    mockWalk.mockReset();
  });

  // -- Empty keys -------------------------------------------------------------

  it('returns empty array when DurationKeys is empty', () => {
    const keyset = makeKeyset({ DurationKeys: [], ScorableDurationKeys: [] });
    expect(processDurationKeys(makeResult(), keyset, makeOptions())).toEqual([]);
    expect(mockWalk).not.toHaveBeenCalled();
  });

  it('returns early (empty) when DurationKeys is empty even if ScorableDurationKeys has items', () => {
    const keyset = makeKeyset({
      DurationKeys: [],
      ScorableDurationKeys: [{ KeyName: 'ScorKey', KeyDescription: 'Scor Key', KeyCode: 99 }],
    });
    const result = processDurationKeys(makeResult(), keyset, makeOptions());
    expect(result).toEqual([]);
  });

  // -- DurationKeys + ScorableDurationKeys combined ---------------------------

  it('processes both DurationKeys and ScorableDurationKeys', () => {
    const keyset = makeKeyset({
      DurationKeys: [{ KeyName: 'DurKey', KeyDescription: 'Dur Key', KeyCode: 1 }],
      ScorableDurationKeys: [{ KeyName: 'ScorKey', KeyDescription: 'Scor Key', KeyCode: 2 }],
    });
    mockWalk.mockReturnValue(walkReturn(30, 3));

    const results = processDurationKeys(makeResult(), keyset, makeOptions('Timer1'));
    expect(results).toHaveLength(2);
  });

  // -- Total timer type -------------------------------------------------------

  it('walks Primary schedule for Total timer type', () => {
    const keyset = makeKeyset({
      DurationKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }],
    });
    mockWalk.mockReturnValueOnce(walkReturn(60));

    processsDurationAndExpect(makeResult(), keyset, makeOptions('Total'), 'Primary');
  });

  // -- Specific timer types ---------------------------------------------------

  it('walks Primary schedule for Timer1', () => {
    const keyset = makeKeyset({ DurationKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    mockWalk.mockReturnValueOnce(walkReturn(60));

    processsDurationAndExpect(makeResult(), keyset, makeOptions('Timer1'), 'Primary');
  });

  it('walks Secondary schedule for Timer2', () => {
    const keyset = makeKeyset({ DurationKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    mockWalk.mockReturnValueOnce(walkReturn(40));

    processsDurationAndExpect(makeResult(), keyset, makeOptions('Timer2'), 'Secondary');
  });

  it('walks Tertiary schedule for Timer3', () => {
    const keyset = makeKeyset({ DurationKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    mockWalk.mockReturnValueOnce(walkReturn(20));

    processsDurationAndExpect(makeResult(), keyset, makeOptions('Timer3'), 'Tertiary');
  });

  // -- Special strategies -----------------------------------------------------

  it('walks Special schedule for special system strategy', () => {
    const keyset = makeKeyset({ DurationKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    const timerType = { type: 'Special' as const, keyName: 'sysKey' };
    const strategy = { special: true, schedule: 'system' as const, keyset, timerType, specialKeyName: 'sysKey' };
    const options: SessionProcessingOptions = {
      timer: { timerType },
      strategy,
      keyTypes: { frequency: true, duration: true, derived: true },
      outputFormat: 'raw',
    };

    mockWalk.mockReturnValueOnce(walkReturn(50, 5));

    const results = processDurationKeys(makeResult(), keyset, options);

    expect(mockWalk).toHaveBeenCalledWith(
      expect.anything(),
      'Special',
      expect.objectContaining({ KeyName: 'KeyA' }),
      strategy,
    );
    expect(results[0].rawValue).toBe(50);
  });

  it('walks Special schedule for special duration strategy', () => {
    const keyset = makeKeyset({ DurationKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    const timerType = { type: 'Special' as const, keyName: 'durKey' };
    const strategy = { special: true, schedule: 'duration' as const, keyset, timerType, specialKeyName: 'durKey' };
    const options: SessionProcessingOptions = {
      timer: { timerType },
      strategy,
      keyTypes: { frequency: true, duration: true, derived: true },
      outputFormat: 'raw',
    };

    mockWalk.mockReturnValueOnce(walkReturn(45, 4));

    const results = processDurationKeys(makeResult(), keyset, options);

    expect(mockWalk).toHaveBeenCalledWith(
      expect.anything(),
      'Special',
      expect.objectContaining({ KeyName: 'KeyA' }),
      strategy,
    );
    expect(results[0].rawValue).toBe(45);
  });

  // -- Percentage calculation -------------------------------------------------

  it('calculates percentage when includePercentages is true and timerSeconds > 0', () => {
    const keyset = makeKeyset({ DurationKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    const result = makeResult({ TimerMain: 200 });
    const options: SessionProcessingOptions = {
      timer: { timerType: 'Total', includePercentages: true },
      strategy: { special: false, schedule: 'system', keyset, timerType: 'Total' },
      keyTypes: { frequency: true, duration: true, derived: true },
      outputFormat: 'raw',
    };

    mockWalk.mockReturnValueOnce(walkReturn(50)); // 50s / 200s = 25%

    const results = processDurationKeys(result, keyset, options);
    expect(results[0].percentage).toBe(25);
  });

  it('does not set percentage when includePercentages is false', () => {
    const keyset = makeKeyset({ DurationKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    mockWalk.mockReturnValueOnce(walkReturn(50));

    const results = processDurationKeys(makeResult(), keyset, makeOptions('Timer1'));
    expect(results[0].percentage).toBeUndefined();
  });

  it('does not set percentage when timerSeconds is 0', () => {
    const keyset = makeKeyset({ DurationKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    const result = makeResult({ TimerMain: 0 });
    const options: SessionProcessingOptions = {
      timer: { timerType: 'Total', includePercentages: true },
      strategy: { special: false, schedule: 'system', keyset, timerType: 'Total' },
      keyTypes: { frequency: true, duration: true, derived: true },
      outputFormat: 'raw',
    };

    mockWalk.mockReturnValueOnce(walkReturn(50));

    const results = processDurationKeys(result, keyset, options);
    expect(results[0].percentage).toBeUndefined();
  });

  // -- Bouts calculation ------------------------------------------------------

  it('sets bouts and averageBout when includeBouts is true', () => {
    const keyset = makeKeyset({ DurationKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    const options: SessionProcessingOptions = {
      timer: { timerType: 'Timer1', includeBouts: true },
      strategy: { special: false, schedule: 'system', keyset, timerType: 'Timer1' },
      keyTypes: { frequency: true, duration: true, derived: true },
      outputFormat: 'raw',
    };

    mockWalk.mockReturnValueOnce(walkReturn(60, 4)); // 60s total, 4 bouts -> avg 15s

    const results = processDurationKeys(makeResult(), keyset, options);
    expect(results[0].bouts).toBe(4);
    expect(results[0].averageBout).toBe(15);
  });

  it('sets averageBout to 0 when bouts is 0', () => {
    const keyset = makeKeyset({ DurationKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    const options: SessionProcessingOptions = {
      timer: { timerType: 'Timer1', includeBouts: true },
      strategy: { special: false, schedule: 'system', keyset, timerType: 'Timer1' },
      keyTypes: { frequency: true, duration: true, derived: true },
      outputFormat: 'raw',
    };

    mockWalk.mockReturnValueOnce(walkReturn(0, 0));

    const results = processDurationKeys(makeResult(), keyset, options);
    expect(results[0].bouts).toBe(0);
    expect(results[0].averageBout).toBe(0);
  });

  it('does not set bouts or averageBout when includeBouts is false', () => {
    const keyset = makeKeyset({ DurationKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    mockWalk.mockReturnValueOnce(walkReturn(60, 4));

    const results = processDurationKeys(makeResult(), keyset, makeOptions('Timer1'));
    expect(results[0].bouts).toBeUndefined();
    expect(results[0].averageBout).toBeUndefined();
  });

  // -- Error handling ---------------------------------------------------------

  it('throws for an invalid non-special timer type', () => {
    const keyset = makeKeyset({ DurationKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    // getUnifiedTimerValue fires before the switch, so its message is what surfaces
    expect(() => processDurationKeys(makeResult(), keyset, makeOptions('BadTimer' as any))).toThrow(
      'Invalid timer type for value retrieval',
    );
  });

  // -- Key metadata -----------------------------------------------------------

  it('populates correct key metadata on each result', () => {
    const keyset = makeKeyset({
      DurationKeys: [{ KeyName: 'DurKey', KeyDescription: 'Duration Key Description', KeyCode: 99 }],
    });
    mockWalk.mockReturnValueOnce(walkReturn(30));

    const results = processDurationKeys(makeResult(), keyset, makeOptions('Timer1'));

    expect(results[0].keyName).toBe('DurKey');
    expect(results[0].keyDescription).toBe('Duration Key Description');
    expect(results[0].keyCode).toBe(99);
    expect(results[0].keyType).toBe('Duration');
    expect(results[0].visible).toBe(true);
  });

  it('rawValue comes from walkSessionDurationKeyStateAware', () => {
    const keyset = makeKeyset({ DurationKeys: [{ KeyName: 'KeyA', KeyDescription: 'Key A', KeyCode: 1 }] });
    mockWalk.mockReturnValueOnce(walkReturn(123));

    const results = processDurationKeys(makeResult(), keyset, makeOptions('Timer1'));
    expect(results[0].rawValue).toBe(123);
  });
});

// -- Helper to assert the schedule used ---------------------------------------

function processsDurationAndExpect(
  result: SavedSessionResult,
  keyset: KeySet,
  options: SessionProcessingOptions,
  expectedSchedule: string,
) {
  processDurationKeys(result, keyset, options);
  expect(mockWalk).toHaveBeenCalledWith(
    expect.anything(),
    expectedSchedule,
    expect.objectContaining({ KeyName: 'KeyA' }),
    expect.anything(),
  );
}
