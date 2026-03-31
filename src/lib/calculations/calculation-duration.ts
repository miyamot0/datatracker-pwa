import { SavedSessionResult } from '@/lib/dtos';
import { walkSessionDurationKeyStateAware } from '@/lib/schedule-parser';
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
      const keyResult = walkSessionDurationKeyStateAware(result, 'Special', key, options.strategy);
      rawValue = keyResult.Value;
      bouts = keyResult.Bouts;
    } else if (options.strategy.special && options.strategy.schedule === 'duration') {
      // Duration special - just sum the scoring key as duration
      const keyResult = walkSessionDurationKeyStateAware(result, 'Special', key, options.strategy);
      rawValue = keyResult.Value;
      bouts = keyResult.Bouts;
    } else {
      if (options.timer.timerType === 'Total') {
        const keyResult = walkSessionDurationKeyStateAware(result, 'Primary', key, options.strategy);

        rawValue = keyResult.Value;
        bouts = keyResult.Bouts;
      } else {
        const schedule = getTimerSchedule(options.timer.timerType);
        const keyResult2 = walkSessionDurationKeyStateAware(result, schedule, key, options.strategy);
        rawValue = keyResult2.Value;
        bouts = keyResult2.Bouts;
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
