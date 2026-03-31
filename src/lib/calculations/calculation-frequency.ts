import { SavedSessionResult } from '@/lib/dtos';
import { walkSessionFrequencyKey } from '@/lib/schedule-parser';
import { KeySet } from '@/types/keyset';
import { getUnifiedTimerMinutes, getTimerSchedule } from './calculation-helpers';
import { SessionProcessingOptions, ProcessedKeyResult } from '../../types/calculation';

/**
 * Processes frequency keys with unified timer system
 *
 * @param result - The session result to process
 * @param keys - The frequency keys to process
 * @param config - Timer configuration for calculations
 * @return An array of processed frequency key results
 */
export function processFrequencyKeys(
  result: SavedSessionResult,
  keyset: KeySet,
  options: SessionProcessingOptions,
): ProcessedKeyResult[] {
  if (keyset.FrequencyKeys.length === 0) return [];

  const timerMinutes = getUnifiedTimerMinutes(result, options);

  return keyset.FrequencyKeys.map((key) => {
    let rawValue: number;

    let processed: ProcessedKeyResult = {
      keyName: key.KeyName,
      keyDescription: key.KeyDescription,
      keyCode: key.KeyCode,
      keyType: 'Frequency',
      rawValue: NaN,
      visible: true, // TODO: Handle conditional display better
    };

    if (options.strategy.special && options.strategy.schedule === 'duration') {
      // Duration special
      const keyResult = walkSessionFrequencyKey(result, 'Special', key, options.strategy);

      rawValue = keyResult.Value;
    } else if (options.strategy.special && options.strategy.schedule === 'system') {
      // Timer special
      const keyResult = walkSessionFrequencyKey(result, 'Special', key, options.strategy);

      rawValue = keyResult.Value;
    } else {
      if (options.timer.timerType === 'Total') {
        const primary = walkSessionFrequencyKey(result, 'Primary', key);
        const secondary = walkSessionFrequencyKey(result, 'Secondary', key);
        const tertiary = walkSessionFrequencyKey(result, 'Tertiary', key);
        rawValue = primary.Value + secondary.Value + tertiary.Value;
      } else {
        const schedule = getTimerSchedule(options.timer.timerType);
        const keyResult = walkSessionFrequencyKey(result, schedule, key);
        rawValue = keyResult.Value;
      }
    }

    /*

    if (options.timer.timerType === 'Total') {
      const primary = walkSessionFrequencyKey(result, 'Primary', key);
      const secondary = walkSessionFrequencyKey(result, 'Secondary', key);
      const tertiary = walkSessionFrequencyKey(result, 'Tertiary', key);
      rawValue = primary.Value + secondary.Value + tertiary.Value;
    } else {
      const schedule = getTimerSchedule(options.timer.timerType);

      const specialKey =
        typeof options.timer.timerType === 'object' && options.timer.timerType.type === 'Special'
          ? options.timer.timerType.keyName
          : undefined;

      const keyResult = walkSessionFrequencyKey(result, schedule, key, specialKey);
      rawValue = keyResult.Value;
    }

    */

    processed = {
      ...processed,
      rawValue,
    };

    if (options.timer.includeRates && timerMinutes > 0) {
      processed.rate = rawValue / timerMinutes;
    }

    return processed;
  });
}
