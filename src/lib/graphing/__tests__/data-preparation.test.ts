import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateChartPreparation,
  calculateSplitPoints,
  prepareProportionDataUniversal,
  prepareRateDataUniversal,
} from '../data-preparation';
import { walkSessionDurationKeyStateAware, walkSessionFrequencyKey } from '../../schedule-parser';
import type { SavedSessionResult } from '../../../dtos/session-results';
import type { SessionTerminationOptionsType } from '@/types/terminations';
import type { KeySet, KeySetInstance } from '@/types/keyset/core';
import type { ExpandedKeySetInstance } from '@/types/keyset/display';
import type { ProcessedKeyResult, ProcessedSessionData } from '@/types/calculation';
import type { LogicState } from '../../logic';

vi.mock('../../schedule-parser', () => ({
  walkSessionFrequencyKey: vi.fn(),
  walkSessionDurationKeyStateAware: vi.fn(),
}));

function key(KeyCode: number, KeyDescription = `key-${KeyCode}`): KeySetInstance {
  return { KeyName: `Name ${KeyCode}`, KeyCode, KeyDescription };
}

function makeSession(overrides: {
  Session?: number;
  Condition?: string;
  FrequencyKeys?: KeySetInstance[];
  DurationKeys?: KeySetInstance[];
}): SavedSessionResult {
  return {
    Keyset: {
      FrequencyKeys: overrides.FrequencyKeys ?? [],
      DurationKeys: overrides.DurationKeys ?? [],
    },
    SessionSettings: {
      Session: overrides.Session ?? 1,
      Condition: overrides.Condition ?? 'Baseline',
      Role: 'Primary',
    },
    FrequencyKeyPresses: [],
    DurationKeyPresses: [],
    TimerMain: 600,
    TimerOne: 100,
    TimerTwo: 200,
    TimerThree: 300,
  } as unknown as SavedSessionResult;
}

function score(KeyDescription: string, Value: number) {
  return { KeyName: KeyDescription, KeyDescription, Value, Schedule: 'Primary', Bouts: 1 };
}

describe('data-preparation', () => {
  beforeEach(() => {
    vi.mocked(walkSessionFrequencyKey).mockReset();
    vi.mocked(walkSessionDurationKeyStateAware).mockReset();
  });

  describe('generateChartPreparation', () => {
    it('scores each frequency key using the mapped schedule and reads the matching timer', () => {
      const session = makeSession({ FrequencyKeys: [key(1, 'A')] });
      vi.mocked(walkSessionFrequencyKey).mockReturnValue(score('A', 4) as never);

      const [row] = generateChartPreparation([session], 'End on Timer #1', 'Frequency');

      expect(walkSessionFrequencyKey).toHaveBeenCalledWith(session, 'Primary', key(1, 'A'));
      expect(row.Scores).toEqual([score('A', 4)]);
      expect(row.SessionTime).toBe(100);
      expect(row.Schedule).toBe('End on Timer #1');
      expect(row.Condition).toBe('Baseline');
    });

    it('maps Timer #2 and Timer #3 to their schedules and session times', () => {
      const session = makeSession({});

      const [t2] = generateChartPreparation([session], 'End on Timer #2', 'Duration');
      const [t3] = generateChartPreparation([session], 'End on Timer #3', 'Duration');

      expect(t2.SessionTime).toBe(200);
      expect(t3.SessionTime).toBe(300);
    });

    it('uses the state-aware duration walker for the Duration perspective', () => {
      const session = makeSession({ DurationKeys: [key(2, 'B')] });
      vi.mocked(walkSessionDurationKeyStateAware).mockReturnValue(score('B', 9) as never);

      const [row] = generateChartPreparation([session], 'End on Timer #2', 'Duration');

      expect(walkSessionDurationKeyStateAware).toHaveBeenCalledWith(session, 'Secondary', key(2, 'B'));
      expect(walkSessionFrequencyKey).not.toHaveBeenCalled();
      expect(row.Scores).toEqual([score('B', 9)]);
    });

    it('uses the primary timer session time for the End on Primary Timer option', () => {
      const session = makeSession({});

      const [row] = generateChartPreparation([session], 'End on Primary Timer', 'Frequency');

      expect(row.SessionTime).toBe(600);
      expect(row.Scores).toEqual([]);
    });

    it('throws for an unknown schedule option when scoring keys', () => {
      const session = makeSession({ FrequencyKeys: [key(1, 'A')] });

      expect(() =>
        generateChartPreparation([session], 'Bogus' as SessionTerminationOptionsType, 'Frequency'),
      ).toThrow('Invalid Schedule Option');
    });

    it('throws for an unknown schedule option when there are no keys to score', () => {
      const session = makeSession({});

      expect(() =>
        generateChartPreparation([session], 'Bogus' as SessionTerminationOptionsType, 'Duration'),
      ).toThrow('Invalid Schedule Option');
    });

    it('appends a derived key score when it is visible in the full keyset', () => {
      const session = makeSession({ FrequencyKeys: [key(1, 'A')] });
      vi.mocked(walkSessionFrequencyKey).mockReturnValue(score('A', 3) as never);
      const derived = {
        id: 'd1',
        name: 'Sum',
        initial: { type: 'constant', value: 10 },
        fields: [{ ...key(1, 'A'), Value: 0, Tag: 'x' }],
        steps: [{ id: 's1', operation: 'add', operand: { type: 'field', field: { ...key(1, 'A'), Value: 0, Tag: 'x' } } }],
        value: 0,
      } as unknown as LogicState;
      const dynamicKeySet = { DerivedKeys: [derived] } as unknown as KeySet;
      const fullKeySet = [{ KeyDescription: 'Sum', Visible: true }] as unknown as ExpandedKeySetInstance[];

      const [row] = generateChartPreparation([session], 'End on Timer #1', 'Frequency', fullKeySet, dynamicKeySet);

      const derivedScore = row.Scores.find((s) => s.KeyDescription === 'Sum');
      expect(derivedScore).toEqual({
        KeyName: 'Sum',
        KeyDescription: 'Sum',
        Value: 13,
        Schedule: 'Primary',
        Bouts: -1,
      });
    });

    it('treats Tertiary timer schedule correctly for duration keys', () => {
      const session = makeSession({ DurationKeys: [key(3, 'C')] });
      vi.mocked(walkSessionDurationKeyStateAware).mockReturnValue(score('C', 1) as never);

      generateChartPreparation([session], 'End on Timer #3', 'Duration');

      expect(walkSessionDurationKeyStateAware).toHaveBeenCalledWith(session, 'Tertiary', key(3, 'C'));
    });

    it('omits a derived key that is hidden or absent from the full keyset', () => {
      const session = makeSession({});
      const derived = {
        id: 'd1',
        name: 'Hidden',
        initial: { type: 'constant', value: 1 },
        fields: [],
        steps: [],
        value: 0,
      } as unknown as LogicState;
      const dynamicKeySet = { DerivedKeys: [derived] } as unknown as KeySet;
      const fullKeySet = [{ KeyDescription: 'Hidden', Visible: false }] as unknown as ExpandedKeySetInstance[];

      const [row] = generateChartPreparation([session], 'End on Timer #1', 'Frequency', fullKeySet, dynamicKeySet);

      expect(row.Scores).toEqual([]);
    });

    it('feeds NaN into a derived field whose source key was not scored', () => {
      const session = makeSession({});
      const derived = {
        id: 'd2',
        name: 'Missing',
        initial: { type: 'constant', value: 0 },
        fields: [{ ...key(9, 'Absent'), Value: 0, Tag: 'x' }],
        steps: [{ id: 's', operation: 'add', operand: { type: 'field', field: { ...key(9, 'Absent'), Value: 0, Tag: 'x' } } }],
        value: 0,
      } as unknown as LogicState;
      const dynamicKeySet = { DerivedKeys: [derived] } as unknown as KeySet;
      const fullKeySet = [{ KeyDescription: 'Missing', Visible: true }] as unknown as ExpandedKeySetInstance[];

      const [row] = generateChartPreparation([session], 'End on Timer #1', 'Frequency', fullKeySet, dynamicKeySet);

      const derivedScore = row.Scores.find((s) => s.KeyDescription === 'Missing');
      expect(derivedScore?.Value).toBeNaN();
    });
  });

  describe('calculateSplitPoints', () => {
    it('returns the index where a session between two points belongs to another condition', () => {
      const conditionData = [{ session: 1 }, { session: 4 }];
      const sessions = [
        makeSession({ Session: 1, Condition: 'A' }),
        makeSession({ Session: 2, Condition: 'B' }),
        makeSession({ Session: 3, Condition: 'A' }),
        makeSession({ Session: 4, Condition: 'A' }),
      ];

      expect(calculateSplitPoints(conditionData, sessions, 'A')).toEqual([1]);
    });

    it('returns no split points when all intervening sessions share the condition', () => {
      const conditionData = [{ session: 1 }, { session: 3 }];
      const sessions = [
        makeSession({ Session: 1, Condition: 'A' }),
        makeSession({ Session: 2, Condition: 'A' }),
        makeSession({ Session: 3, Condition: 'A' }),
      ];

      expect(calculateSplitPoints(conditionData, sessions, 'A')).toEqual([]);
    });

    it('ignores null entries and handles fewer than two points', () => {
      const sessions = [null as unknown as SavedSessionResult, makeSession({ Session: 2, Condition: 'B' })];

      expect(calculateSplitPoints([{ session: 1 }], sessions, 'A')).toEqual([]);
      expect(calculateSplitPoints([{ session: 1 }, { session: 3 }], sessions, 'A')).toEqual([1]);
    });
  });

  describe('prepareProportionDataUniversal', () => {
    const base = {
      session: 2,
      condition: 'Baseline',
      date: new Date(0),
      collector: '',
      therapist: '',
      timerType: 'Primary',
      timerLabel: '',
      timerDuration: 10,
      frequencyKeys: [],
      derivedKeys: [],
    } as unknown as ProcessedSessionData;

    it('flattens duration keys into percentage, bouts, and average bout columns', () => {
      const duration: ProcessedKeyResult = {
        keyName: 'Dk',
        keyDescription: 'Walk',
        keyCode: 1,
        keyType: 'Duration',
        rawValue: 0,
        percentage: 50,
        bouts: 3,
        averageBout: 2,
        visible: true,
      };

      const { preparedData } = prepareProportionDataUniversal([{ ...base, durationKeys: [duration] }]);

      expect(preparedData).toEqual([
        {
          session: 2,
          Condition: 'Baseline',
          SessionTime: 10,
          Walk: 50,
          'Walk-Bouts': 3,
          'Walk-Bout-Ave': 2,
        },
      ]);
    });

    it('returns only base columns when there are no duration keys', () => {
      const { preparedData } = prepareProportionDataUniversal([{ ...base, durationKeys: undefined } as never]);

      expect(preparedData[0]).toEqual({ session: 2, Condition: 'Baseline', SessionTime: 10 });
    });
  });

  describe('prepareRateDataUniversal', () => {
    const base = {
      session: 1,
      condition: 'Baseline',
      date: new Date(0),
      collector: '',
      therapist: '',
      timerType: 'Primary',
      timerLabel: '',
      timerDuration: 5,
      frequencyKeys: [],
      durationKeys: [],
      derivedKeys: [],
    } as unknown as ProcessedSessionData;

    const rateKey = (keyDescription: string, rate: number | undefined): ProcessedKeyResult => ({
      keyName: keyDescription,
      keyDescription,
      keyCode: 0,
      keyType: 'Frequency',
      rawValue: 0,
      rate,
      visible: true,
    });

    it('records the rate per key and tracks the max across frequency and derived keys', () => {
      const data = {
        ...base,
        frequencyKeys: [rateKey('F1', 2), rateKey('F2', 7)],
        derivedKeys: [rateKey('D1', 4)],
      } as ProcessedSessionData;

      const { preparedData, maxY } = prepareRateDataUniversal([data]);

      expect(preparedData).toEqual([
        { session: 1, Condition: 'Baseline', SessionTime: 5, F1: 2, F2: 7, D1: 4 },
      ]);
      expect(maxY).toBe(7);
    });

    it('raises maxY from a derived key rate that exceeds the frequency rates', () => {
      const data = {
        ...base,
        frequencyKeys: [rateKey('F1', 2)],
        derivedKeys: [rateKey('D1', 9)],
      } as ProcessedSessionData;

      const { maxY } = prepareRateDataUniversal([data]);

      expect(maxY).toBe(9);
    });

    it('does not raise maxY for zero or undefined rates', () => {
      const data = {
        ...base,
        frequencyKeys: [rateKey('Z', 0), rateKey('U', undefined)],
      } as ProcessedSessionData;

      const { maxY } = prepareRateDataUniversal([data]);

      expect(maxY).toBe(0);
    });

    it('handles sessions without frequency or derived key arrays', () => {
      const data = { ...base, frequencyKeys: undefined, derivedKeys: undefined } as never;

      const { preparedData, maxY } = prepareRateDataUniversal([data]);

      expect(preparedData[0]).toEqual({ session: 1, Condition: 'Baseline', SessionTime: 5 });
      expect(maxY).toBe(0);
    });
  });
});
