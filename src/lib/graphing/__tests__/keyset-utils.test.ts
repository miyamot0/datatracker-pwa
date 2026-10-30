import { describe, it, expect } from 'vitest';
import { extractAndDeduplicateKeysets, mapKeysWithStoragePreference } from '../keyset-utils';
import type { KeySet, KeySetInstance } from '@/types/keyset/core';
import type { LogicState } from '../../logic';
import type { ModifiedSessionResult } from '@/types/storage';
import type { ToggleDisplayKey } from '@/types/visuals';
import type { ReturnLocalStorageCache } from '../../local_storage';

function key(KeyCode: number, KeyDescription = `key-${KeyCode}`): KeySetInstance {
  return { KeyName: `Name ${KeyCode}`, KeyCode, KeyDescription };
}

function logic(id: string): LogicState {
  return { id, name: `logic ${id}`, initial: { type: 'constant', value: 0 }, fields: [], steps: [], value: 0 };
}

function makeKeyset(overrides: Partial<KeySet> = {}): KeySet {
  return {
    id: 'ks',
    Name: 'Keyset',
    FrequencyKeys: [],
    DurationKeys: [],
    createdAt: new Date(0),
    lastModified: new Date(0),
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
    ...overrides,
  };
}

function makeResult(keyset: Partial<KeySet>) {
  return { Keyset: makeKeyset(keyset) } as unknown as ModifiedSessionResult;
}

describe('keyset-utils', () => {
  describe('extractAndDeduplicateKeysets', () => {
    it('merges keys across results and the latest keyset, deduplicated by KeyCode', () => {
      const results = [
        makeResult({ FrequencyKeys: [key(1), key(2)], DurationKeys: [key(10)] }),
        makeResult({ FrequencyKeys: [key(2), key(3)], DurationKeys: [key(10), key(11)] }),
      ];
      const latest = makeKeyset({ FrequencyKeys: [key(3), key(4)], DurationKeys: [key(12)] });

      const out = extractAndDeduplicateKeysets(results, latest);

      expect(out.frequencyKeys.map((k) => k.KeyCode)).toEqual([1, 2, 3, 4]);
      expect(out.durationKeys.map((k) => k.KeyCode)).toEqual([10, 11, 12]);
    });

    it('keeps the first occurrence when the same KeyCode appears with different metadata', () => {
      const first = key(7, 'first');
      const second = key(7, 'second');
      const results = [makeResult({ FrequencyKeys: [first] })];
      const latest = makeKeyset({ FrequencyKeys: [second] });

      const out = extractAndDeduplicateKeysets(results, latest);

      expect(out.frequencyKeys).toEqual([first]);
    });

    it('deduplicates derived logic keys by id', () => {
      const results = [makeResult({ DerivedKeys: [logic('a'), logic('b')] })];
      const latest = makeKeyset({ DerivedKeys: [logic('b'), logic('c')] });

      const out = extractAndDeduplicateKeysets(results, latest);

      expect(out.derivedKeys.map((k) => k.id)).toEqual(['a', 'b', 'c']);
    });

    it('deduplicates special and scorable duration keys by KeyCode', () => {
      const results = [
        makeResult({ SpecialDurationKeys: [key(20)], ScorableDurationKeys: [key(30)] }),
      ];
      const latest = makeKeyset({
        SpecialDurationKeys: [key(20), key(21)],
        ScorableDurationKeys: [key(30), key(31)],
      });

      const out = extractAndDeduplicateKeysets(results, latest);

      expect(out.specialDurationKeys.map((k) => k.KeyCode)).toEqual([20, 21]);
      expect(out.scorableDurationKeys.map((k) => k.KeyCode)).toEqual([30, 31]);
    });

    it('treats missing optional arrays as empty', () => {
      const results = [
        {
          Keyset: {
            FrequencyKeys: [key(1)],
            DurationKeys: [],
            DerivedKeys: undefined,
            SpecialDurationKeys: undefined,
            ScorableDurationKeys: undefined,
          },
        } as unknown as ModifiedSessionResult,
      ];
      const latest = {
        FrequencyKeys: [],
        DurationKeys: [],
        DerivedKeys: undefined,
        SpecialDurationKeys: undefined,
        ScorableDurationKeys: undefined,
      } as unknown as KeySet;

      const out = extractAndDeduplicateKeysets(results, latest);

      expect(out.frequencyKeys.map((k) => k.KeyCode)).toEqual([1]);
      expect(out.derivedKeys).toEqual([]);
      expect(out.specialDurationKeys).toEqual([]);
      expect(out.scorableDurationKeys).toEqual([]);
    });

    it('ignores results that have no attached keyset', () => {
      const results = [
        { Keyset: undefined } as unknown as ModifiedSessionResult,
        makeResult({ FrequencyKeys: [key(1)] }),
        { Keyset: null } as unknown as ModifiedSessionResult,
      ];
      const latest = makeKeyset({ FrequencyKeys: [key(2)], DurationKeys: [key(3)] });

      const out = extractAndDeduplicateKeysets(results, latest);

      expect(out.frequencyKeys.map((k) => k.KeyCode)).toEqual([1, 2]);
      expect(out.durationKeys.map((k) => k.KeyCode)).toEqual([3]);
    });

    it('returns empty collections when no results have keysets and the latest is empty', () => {
      const out = extractAndDeduplicateKeysets(
        [{ Keyset: undefined } as unknown as ModifiedSessionResult],
        makeKeyset(),
      );

      expect(out.frequencyKeys).toEqual([]);
      expect(out.durationKeys).toEqual([]);
      expect(out.derivedKeys).toEqual([]);
    });

    it('returns only the latest keyset when there are no results', () => {
      const latest = makeKeyset({ FrequencyKeys: [key(5)], DurationKeys: [key(6)] });

      const out = extractAndDeduplicateKeysets([], latest);

      expect(out.frequencyKeys.map((k) => k.KeyCode)).toEqual([5]);
      expect(out.durationKeys.map((k) => k.KeyCode)).toEqual([6]);
    });
  });

  describe('mapKeysWithStoragePreference', () => {
    it('hides keys whose description is in the stored preferences and leaves others untouched', () => {
      const keys = [
        { KeyDescription: 'Hidden One', Visible: true },
        { KeyDescription: 'Shown', Visible: true },
      ] as unknown as ToggleDisplayKey[];
      const prefs = { KeyDescription: ['Hidden One'] } as unknown as ReturnLocalStorageCache;

      const out = mapKeysWithStoragePreference(keys, prefs);

      expect(out[0]).toEqual({ KeyDescription: 'Hidden One', Visible: false });
      expect(out[1]).toBe(keys[1]);
    });

    it('returns keys unchanged when there are no stored preferences', () => {
      const keys = [{ KeyDescription: 'A', Visible: true }] as unknown as ToggleDisplayKey[];
      const prefs = { KeyDescription: [] } as unknown as ReturnLocalStorageCache;

      expect(mapKeysWithStoragePreference(keys, prefs)).toEqual(keys);
    });
  });
});
