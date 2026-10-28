import { describe, it, expect } from 'vitest';
import { calculateSplitPoints, prepareProportionDataUniversal, prepareRateDataUniversal } from '../data-preparation';
import type { SavedSessionResult } from '../../../dtos/session-results';
import type { KeySetInstance } from '@/types/keyset/core';
import type { ProcessedKeyResult, ProcessedSessionData } from '@/types/calculation';

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

describe('data-preparation', () => {
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
