import { SavedSessionResult } from '@/lib/dtos';
import { walkSessionFrequencyKey } from '@/lib/schedule-parser';
import { KeySet } from '@/types/keyset';
import { getUnifiedTimerMinutes, getTimerSchedule } from './calculation-helpers';
import { SessionProcessingOptions, ProcessedKeyResult } from './calculation-types';

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
      // TODO: Not done
      console.error('Not implemented yet: Special schedule with duration-based timer for frequency key processing');
      rawValue = 0;
    } else if (options.strategy.special && options.strategy.schedule === 'system') {
      // Timer special
      const keyResult = walkSessionFrequencyKey(
        result,
        'Special',
        key,
        (options.strategy.timerType as { type: 'Special'; keyName: string }).keyName,
      );

      rawValue = keyResult.Value;
    } else {
      switch (options.timer.timerType) {
        case 'Total':
          const primary = walkSessionFrequencyKey(result, 'Primary', key);
          const secondary = walkSessionFrequencyKey(result, 'Secondary', key);
          const tertiary = walkSessionFrequencyKey(result, 'Tertiary', key);
          rawValue = primary.Value + secondary.Value + tertiary.Value;
          break;
        case 'Timer1':
        case 'Timer2':
        case 'Timer3':
          const schedule = getTimerSchedule(options.timer.timerType);
          const keyResult = walkSessionFrequencyKey(result, schedule, key);
          rawValue = keyResult.Value;
          break;
        default:
          throw new Error('Invalid timer type for frequency key processing');
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
