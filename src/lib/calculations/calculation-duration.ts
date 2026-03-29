import { SavedSessionResult } from '@/lib/dtos';
import { walkSessionDurationKey } from '@/lib/schedule-parser';
import { KeySet } from '@/types/keyset';
import { getUnifiedTimerValue, getTimerSchedule } from './calculation-helpers';
import { SessionProcessingOptions, ProcessedKeyResult } from '../../types/calculation';

/**
 * Processes duration keys with unified timer system
 *
 * @param result - The session result to process
 * @param keys - The duration keys to process
 * @param config - Timer configuration for calculations
 * @return An array of processed duration key results
 */
export function processDurationKeys(
  result: SavedSessionResult,
  keyset: KeySet,
  options: SessionProcessingOptions,
): ProcessedKeyResult[] {
  if (keyset.DurationKeys.length === 0) return [];

  const timerSeconds = getUnifiedTimerValue(result, options);

  const allRelevantKeys = [...keyset.DurationKeys, ...keyset.ScorableDurationKeys];

  return allRelevantKeys.map((key) => {
    let rawValue: number = NaN;
    let bouts: number | undefined;

    let processed: ProcessedKeyResult = {
      keyName: key.KeyName,
      keyDescription: key.KeyDescription,
      keyCode: key.KeyCode,
      keyType: 'Duration',
      rawValue,
      visible: true, // TODO: Handle conditional display better
    };

    if (options.strategy.special && options.strategy.schedule === 'system') {
      // Timer special
      const keyResult = walkSessionDurationKey(result, 'Special', key, options.strategy);
      rawValue = keyResult.Value;
      bouts = keyResult.Bouts;
    } else if (options.strategy.special && options.strategy.schedule === 'duration') {
      // Duration special - just sum the scoring key as duration
      const keyResult = walkSessionDurationKey(result, 'Special', key, options.strategy);
      rawValue = keyResult.Value;
      bouts = keyResult.Bouts;
    } else {
      switch (options.timer.timerType) {
        case 'Total':
          {
            const keyResult = walkSessionDurationKey(result, 'Primary', key);

            rawValue = keyResult.Value;
            bouts = keyResult.Bouts;
          }
          break;
        case 'Timer1':
        case 'Timer2':
        case 'Timer3':
          {
            const schedule = getTimerSchedule(options.timer.timerType);
            const keyResult2 = walkSessionDurationKey(result, schedule, key);
            rawValue = keyResult2.Value;
            bouts = keyResult2.Bouts;
          }
          break;
        default:
          throw new Error('Invalid timer type for duration key processing');
      }
    }

    processed = {
      ...processed,
      rawValue,
    };

    // Add calculated values based on options
    if (options.timer.includePercentages && timerSeconds > 0) {
      processed.percentage = (rawValue / timerSeconds) * 100;
    }

    if (options.timer.includeBouts && bouts !== undefined) {
      processed.bouts = bouts;
      processed.averageBout = bouts > 0 ? rawValue / bouts : 0;
    }

    return processed;
  });
}
