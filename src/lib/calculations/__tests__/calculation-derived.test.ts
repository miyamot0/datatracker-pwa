import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processDerivedKeys } from '@/lib/calculations/calculation-derived';
import type { SavedSessionResult } from '@/lib/dtos';
import type { KeySet } from '@/types/keyset';
import type { LogicState } from '@/lib/logic';
import type { SessionProcessingOptions, ProcessedKeyResult } from '@/types/calculation';

vi.mock('@/lib/logic', () => ({
  evaluateLogic: vi.fn(),
}));

vi.mock('@/lib/calculations/calculation-helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/calculations/calculation-helpers')>();
  return {
    ...actual,
    getUnifiedTimerMinutes: vi.fn().mockReturnValue(10),
  };
});

import { evaluateLogic } from '@/lib/logic';
import { getUnifiedTimerMinutes } from '../calculation-helpers';

const mockEvaluate = vi.mocked(evaluateLogic);
const mockTimerMinutes = vi.mocked(getUnifiedTimerMinutes);

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

function makeOptions(timerType: any = 'Total'): SessionProcessingOptions {
  const keyset = makeKeyset();
  return {
    timer: { timerType, includeRates: false },
    strategy: { special: false, schedule: 'system', keyset, timerType },
    keyTypes: { frequency: true, duration: true, derived: true },
    outputFormat: 'raw',
  };
}

function makeDerivedKey(overrides: Partial<LogicState> = {}): LogicState {
  return {
    id: 'derived-1',
    name: 'Rate',
    initial: { type: 'constant', value: 0 },
    fields: [{ KeyName: 'FreqA', KeyDescription: 'Frequency A', KeyCode: 1, Value: 0, Tag: '' }],
    steps: [],
    value: 0,
    ...overrides,
  };
}

function makeFreqResult(keyCode: number, rawValue: number): ProcessedKeyResult {
  return {
    keyName: `Key${keyCode}`,
    keyDescription: `Key ${keyCode}`,
    keyCode,
    keyType: 'Frequency',
    rawValue,
    visible: true,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('processDerivedKeys', () => {
  beforeEach(() => {
    mockEvaluate.mockReset();
    mockTimerMinutes.mockReturnValue(10);
  });

  // ── Early returns ──────────────────────────────────────────────────────────

  it('returns empty array when DerivedKeys is empty', () => {
    const keyset = makeKeyset({ FrequencyKeys: [{ KeyName: 'FreqA', KeyDescription: 'Freq A', KeyCode: 1 }] });
    const result = processDerivedKeys(makeResult(), keyset, makeOptions(), [makeFreqResult(1, 5)]);
    expect(result).toEqual([]);
    expect(mockEvaluate).not.toHaveBeenCalled();
  });

  it('returns empty array when FrequencyKeys is empty', () => {
    const derived = makeDerivedKey();
    const keyset = makeKeyset({ DerivedKeys: [derived], FrequencyKeys: [] });
    const result = processDerivedKeys(makeResult(), keyset, makeOptions(), []);
    expect(result).toEqual([]);
    expect(mockEvaluate).not.toHaveBeenCalled();
  });

  it('returns empty array when both DerivedKeys and FrequencyKeys are empty', () => {
    const keyset = makeKeyset();
    expect(processDerivedKeys(makeResult(), keyset, makeOptions(), [])).toEqual([]);
  });

  it('returns empty array when keyset arrays are undefined and fallback to empty arrays', () => {
    const keyset = makeKeyset({ DerivedKeys: undefined as any, FrequencyKeys: undefined as any });
    expect(processDerivedKeys(makeResult(), keyset, makeOptions(), [])).toEqual([]);
  });

  // ── Normal computation ─────────────────────────────────────────────────────

  it('calls evaluateLogic with fields populated from frequencyResults', () => {
    const derived = makeDerivedKey({
      fields: [{ KeyName: 'FreqA', KeyDescription: 'Frequency A', KeyCode: 1, Value: 0, Tag: '' }],
    });
    const keyset = makeKeyset({
      DerivedKeys: [derived],
      FrequencyKeys: [{ KeyName: 'FreqA', KeyDescription: 'Frequency A', KeyCode: 1 }],
    });
    mockEvaluate.mockReturnValue(7);

    processDerivedKeys(makeResult(), keyset, makeOptions(), [makeFreqResult(1, 7)]);

    expect(mockEvaluate).toHaveBeenCalledTimes(1);
    const calledWith = mockEvaluate.mock.calls[0][0] as any;
    expect(calledWith.fields[0].Value).toBe(7);
  });

  it('rawValue is the return value of evaluateLogic', () => {
    const derived = makeDerivedKey();
    const keyset = makeKeyset({
      DerivedKeys: [derived],
      FrequencyKeys: [{ KeyName: 'FreqA', KeyDescription: 'Frequency A', KeyCode: 1 }],
    });
    mockEvaluate.mockReturnValue(42);

    const results = processDerivedKeys(makeResult(), keyset, makeOptions(), [makeFreqResult(1, 42)]);
    expect(results[0].rawValue).toBe(42);
  });

  // ── Missing key lookups ────────────────────────────────────────────────────

  it('sets field Value to NaN when the frequency key is not in FrequencyKeys', () => {
    const derived = makeDerivedKey({
      fields: [{ KeyName: 'Missing', KeyDescription: 'Missing', KeyCode: 999, Value: 0, Tag: '' }],
    });
    const keyset = makeKeyset({
      DerivedKeys: [derived],
      FrequencyKeys: [{ KeyName: 'FreqA', KeyDescription: 'Frequency A', KeyCode: 1 }],
    });
    mockEvaluate.mockReturnValue(NaN);

    processDerivedKeys(makeResult(), keyset, makeOptions(), [makeFreqResult(1, 5)]);

    const calledWith = mockEvaluate.mock.calls[0][0] as any;
    expect(calledWith.fields[0].Value).toBeNaN();
  });

  it('sets field Value to NaN when the frequency key is missing from frequencyResults', () => {
    const derived = makeDerivedKey({
      fields: [{ KeyName: 'FreqA', KeyDescription: 'Frequency A', KeyCode: 1, Value: 0, Tag: '' }],
    });
    const keyset = makeKeyset({
      DerivedKeys: [derived],
      FrequencyKeys: [{ KeyName: 'FreqA', KeyDescription: 'Frequency A', KeyCode: 1 }],
    });
    mockEvaluate.mockReturnValue(NaN);

    // Pass empty frequencyResults — key 1 won't be found
    processDerivedKeys(makeResult(), keyset, makeOptions(), []);

    const calledWith = mockEvaluate.mock.calls[0][0] as any;
    expect(calledWith.fields[0].Value).toBeNaN();
  });

  // ── Rate calculation ───────────────────────────────────────────────────────

  it('calculates rate when includeRates is true and timerMinutes > 0', () => {
    const derived = makeDerivedKey();
    const keyset = makeKeyset({
      DerivedKeys: [derived],
      FrequencyKeys: [{ KeyName: 'FreqA', KeyDescription: 'Frequency A', KeyCode: 1 }],
    });
    mockTimerMinutes.mockReturnValue(5);
    mockEvaluate.mockReturnValue(20);

    const options: SessionProcessingOptions = {
      timer: { timerType: 'Total', includeRates: true },
      strategy: { special: false, schedule: 'system', keyset, timerType: 'Total' },
      keyTypes: { frequency: true, duration: true, derived: true },
      outputFormat: 'raw',
    };

    const results = processDerivedKeys(makeResult(), keyset, options, [makeFreqResult(1, 20)]);
    expect(results[0].rate).toBe(4); // 20 / 5 minutes
  });

  it('does not set rate when includeRates is false', () => {
    const derived = makeDerivedKey();
    const keyset = makeKeyset({
      DerivedKeys: [derived],
      FrequencyKeys: [{ KeyName: 'FreqA', KeyDescription: 'Frequency A', KeyCode: 1 }],
    });
    mockEvaluate.mockReturnValue(20);

    const results = processDerivedKeys(makeResult(), keyset, makeOptions(), [makeFreqResult(1, 20)]);
    expect(results[0].rate).toBeUndefined();
  });

  it('does not set rate when timerMinutes is 0', () => {
    const derived = makeDerivedKey();
    const keyset = makeKeyset({
      DerivedKeys: [derived],
      FrequencyKeys: [{ KeyName: 'FreqA', KeyDescription: 'Frequency A', KeyCode: 1 }],
    });
    mockTimerMinutes.mockReturnValue(0);
    mockEvaluate.mockReturnValue(20);

    const options: SessionProcessingOptions = {
      timer: { timerType: 'Total', includeRates: true },
      strategy: { special: false, schedule: 'system', keyset, timerType: 'Total' },
      keyTypes: { frequency: true, duration: true, derived: true },
      outputFormat: 'raw',
    };

    const results = processDerivedKeys(makeResult(), keyset, options, [makeFreqResult(1, 20)]);
    expect(results[0].rate).toBeUndefined();
  });

  // ── Key code assignment ────────────────────────────────────────────────────

  it('assigns keyCode of -999 because LogicState.id is always a string', () => {
    // derived.id is typed as `string`, so `typeof derived.id === 'number'` is always false
    const derived = makeDerivedKey({ id: 'string-id' });
    const keyset = makeKeyset({
      DerivedKeys: [derived],
      FrequencyKeys: [{ KeyName: 'FreqA', KeyDescription: 'Frequency A', KeyCode: 1 }],
    });
    mockEvaluate.mockReturnValue(0);

    const results = processDerivedKeys(makeResult(), keyset, makeOptions(), [makeFreqResult(1, 0)]);
    expect(results[0].keyCode).toBe(-999);
  });

  it('uses numeric derived id as keyCode when provided', () => {
    const derived = makeDerivedKey({ id: 123 as any });
    const keyset = makeKeyset({
      DerivedKeys: [derived],
      FrequencyKeys: [{ KeyName: 'FreqA', KeyDescription: 'Frequency A', KeyCode: 1 }],
    });
    mockEvaluate.mockReturnValue(0);

    const results = processDerivedKeys(makeResult(), keyset, makeOptions(), [makeFreqResult(1, 0)]);
    expect(results[0].keyCode).toBe(123);
  });

  // ── Key metadata ───────────────────────────────────────────────────────────

  it('populates keyName, keyDescription, keyType, and visible from the derived key', () => {
    const derived = makeDerivedKey({ name: 'My Derived Key' });
    const keyset = makeKeyset({
      DerivedKeys: [derived],
      FrequencyKeys: [{ KeyName: 'FreqA', KeyDescription: 'Frequency A', KeyCode: 1 }],
    });
    mockEvaluate.mockReturnValue(3);

    const results = processDerivedKeys(makeResult(), keyset, makeOptions(), [makeFreqResult(1, 3)]);

    expect(results[0].keyName).toBe('My Derived Key');
    expect(results[0].keyDescription).toBe('My Derived Key');
    expect(results[0].keyType).toBe('Derived');
    expect(results[0].visible).toBe(true);
  });

  // ── Multiple keys ──────────────────────────────────────────────────────────

  it('processes multiple derived keys', () => {
    const derived1 = makeDerivedKey({ id: 'd1', name: 'Derived1' });
    const derived2 = makeDerivedKey({
      id: 'd2',
      name: 'Derived2',
      fields: [{ KeyName: 'FreqB', KeyDescription: 'Frequency B', KeyCode: 2, Value: 0, Tag: '' }],
    });
    const keyset = makeKeyset({
      DerivedKeys: [derived1, derived2],
      FrequencyKeys: [
        { KeyName: 'FreqA', KeyDescription: 'Frequency A', KeyCode: 1 },
        { KeyName: 'FreqB', KeyDescription: 'Frequency B', KeyCode: 2 },
      ],
    });
    mockEvaluate.mockReturnValueOnce(5).mockReturnValueOnce(8);

    const results = processDerivedKeys(makeResult(), keyset, makeOptions(), [
      makeFreqResult(1, 5),
      makeFreqResult(2, 8),
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].rawValue).toBe(5);
    expect(results[1].rawValue).toBe(8);
  });

  // ── timerMinutes passed to field values ────────────────────────────────────

  it('attaches timerMinutes to each field value passed to evaluateLogic', () => {
    mockTimerMinutes.mockReturnValue(7);
    const derived = makeDerivedKey({
      fields: [{ KeyName: 'FreqA', KeyDescription: 'Frequency A', KeyCode: 1, Value: 0, Tag: '' }],
    });
    const keyset = makeKeyset({
      DerivedKeys: [derived],
      FrequencyKeys: [{ KeyName: 'FreqA', KeyDescription: 'Frequency A', KeyCode: 1 }],
    });
    mockEvaluate.mockReturnValue(0);

    processDerivedKeys(makeResult(), keyset, makeOptions(), [makeFreqResult(1, 3)]);

    const calledWith = mockEvaluate.mock.calls[0][0] as any;
    expect(calledWith.fields[0].Minutes).toBe(7);
  });
});
