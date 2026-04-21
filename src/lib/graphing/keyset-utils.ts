import { ToggleDisplayKey } from '@/types/visuals';
import { KeySetInstance, KeySet } from '@/types/keyset/core';
import { ModifiedSessionResult } from '@/types/storage';
import { LogicState } from '../logic';
import { ReturnLocalStorageCache } from '../local_storage';

/**
 * Extracts and deduplicates keysets from session results to create a dynamic keyset for visualization
 * @param results - Array of session results containing keysets
 * @returns An object containing deduplicated frequency and duration keys for use in visualizations
 */
export function extractAndDeduplicateKeysets(results: ModifiedSessionResult[], latestKeyset: KeySet) {
  const allKeysets = results.map((result) => result.Keyset);

  const allFKeys = [...allKeysets, latestKeyset].map((keyset) => keyset.FrequencyKeys).flat();
  const allDKeys = [...allKeysets, latestKeyset].map((keyset) => keyset.DurationKeys).flat();
  const allDerivedKeys = [...allKeysets, latestKeyset].map((keyset) => keyset.DerivedKeys || []).flat();
  const allSpecialDurationKeys = [...allKeysets, latestKeyset].map((keyset) => keyset.SpecialDurationKeys || []).flat();
  const allScorableDurationKeys = [...allKeysets, latestKeyset]
    .map((keyset) => keyset.ScorableDurationKeys || [])
    .flat();

  const targetedFKeys: KeySetInstance[] = [];
  allFKeys.forEach((key) => {
    if (!targetedFKeys.some((k) => k.KeyCode === key.KeyCode)) {
      targetedFKeys.push(key);
    }
  });

  const targetedDKeys: KeySetInstance[] = [];
  allDKeys.forEach((key) => {
    if (!targetedDKeys.some((k) => k.KeyCode === key.KeyCode)) {
      targetedDKeys.push(key);
    }
  });

  const targetedDerivedKeys: LogicState[] = [];
  allDerivedKeys.forEach((key) => {
    if (!targetedDerivedKeys.some((k) => k.id === key.id)) {
      targetedDerivedKeys.push(key);
    }
  });

  const targetedSpecialDurationKeys: KeySetInstance[] = [];
  allSpecialDurationKeys.forEach((key) => {
    if (!targetedSpecialDurationKeys.some((k) => k.KeyCode === key.KeyCode)) {
      targetedSpecialDurationKeys.push(key);
    }
  });

  const targetedScorableDurationKeys: KeySetInstance[] = [];
  allScorableDurationKeys.forEach((key) => {
    if (!targetedScorableDurationKeys.some((k) => k.KeyCode === key.KeyCode)) {
      targetedScorableDurationKeys.push(key);
    }
  });

  return {
    frequencyKeys: targetedFKeys,
    durationKeys: targetedDKeys,
    derivedKeys: targetedDerivedKeys,
    specialDurationKeys: targetedSpecialDurationKeys,
    scorableDurationKeys: targetedScorableDurationKeys,
  };
}

/**
 * Maps keys with their storage preference visibility based on stored preferences
 */
export function mapKeysWithStoragePreference(keys: ToggleDisplayKey[], storedPreferences: ReturnLocalStorageCache) {
  return keys.map((key) => {
    const shouldDisable = storedPreferences.KeyDescription.includes(key.KeyDescription);

    if (shouldDisable) {
      return {
        ...key,
        Visible: false,
      } satisfies ToggleDisplayKey;
    }

    return key;
  });
}
