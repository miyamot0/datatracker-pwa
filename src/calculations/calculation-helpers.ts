import { SavedSessionResult } from '@/lib/dtos';
import { sumDurationScoringKey, sumDurationSpecialKey } from '@/lib/schedule-parser';
import { KeySet } from '@/types/keyset';
import { ScoringStrategy, SessionProcessingOptions, UnifiedTimerType } from './calculation-types';
import { KeyTiming } from '@/types/timing';
import { SessionTerminationOptions, SessionTerminationOptionsType } from '@/types/terminations';

/**
 * Gets timer value in seconds based on unified timer type
 *
 * @param result - The session result to process
 * @param timerType - The unified timer type
 * @return The timer value in seconds
 */
export function getUnifiedTimerValue(result: SavedSessionResult, options: SessionProcessingOptions): number {
  const { timer, strategy } = options;
  const { timerType } = timer;

  if (strategy.special) {
    // Note: a special type of timing warranted
    if (strategy.schedule === 'duration') {
      // Just a scoring key like normal duration here (Duration)
      return sumDurationScoringKey(result, (timerType as { type: 'Special'; keyName: string }).keyName);
    } else {
      // A separate timer in this case (System)
      return sumDurationSpecialKey(result, (timerType as { type: 'Special'; keyName: string }).keyName);
    }
  }

  switch (timerType) {
    case 'Total':
      return result.TimerMain;
    case 'Timer1':
      return result.TimerOne;
    case 'Timer2':
      return result.TimerTwo;
    case 'Timer3':
      return result.TimerThree;
    default:
      throw new Error('Invalid timer type for value retrieval');
  }
}

/**
 * Gets timer value in minutes based on unified timer type
 *
 * @param result - The session result to process
 * @param timerType - The unified timer type
 * @return The timer value in minutes
 */
export function getUnifiedTimerMinutes(result: SavedSessionResult, options: SessionProcessingOptions): number {
  return getUnifiedTimerValue(result, options) / 60;
}

/**
 * Gets a user-friendly label for the timer based on unified timer type
 *
 * @param timerType - The unified timer type
 * @return A string label to display for this timer type
 */
export function getUnifiedTimerLabel(options: SessionProcessingOptions): string {
  const { timer, strategy } = options;
  const { timerType } = timer;

  if (strategy.special) {
    if (strategy.schedule === 'duration') {
      // Just a scoring key like normal duration here (Duration)
      return `${(timerType as { type: 'Special'; keyName: string }).keyName} (Scoring)`;
    } else {
      // A separate timer in this case (System)
      return `${(timerType as { type: 'Special'; keyName: string }).keyName} (Timing)`;
    }
  }

  // Not special here
  switch (timerType) {
    case 'Total':
      return 'Session';
    case 'Timer1':
      return 'Timer #1';
    case 'Timer2':
      return 'Timer #2';
    case 'Timer3':
      return 'Timer #3';
    default:
      throw new Error('Invalid timer type for labeling');
  }
}

/**
 * Determines the schedule to use for key processing based on timer type
 *
 * @param timerType - The unified timer type
 * @return The schedule key to use for processing frequency/duration keys
 */
export function getTimerSchedule(timerType: UnifiedTimerType): KeyTiming {
  if (typeof timerType === 'object' && timerType.type === 'Special') {
    return 'Special';
  }

  switch (timerType) {
    case 'Timer1':
      return 'Primary';
    case 'Timer2':
      return 'Secondary';
    case 'Timer3':
      return 'Tertiary';
    case 'Total':
    default:
      return 'Primary'; // This will be handled specially in calculations
  }
}

/**
 * Converts legacy SessionTerminationOptionsType to UnifiedTimerType
 *
 * @param legacyType - The legacy timer type from session settings
 * @param keyset - The keyset, needed to resolve special duration keys if applicable
 * @return The corresponding UnifiedTimerType for use in processing
 */
export function convertLegacyTimerType(legacyType: SessionTerminationOptionsType, keyset: KeySet): UnifiedTimerType {
  switch (legacyType) {
    case SessionTerminationOptions.TimerMain:
      return 'Total';
    case SessionTerminationOptions.Timer1:
      return 'Timer1';
    case SessionTerminationOptions.Timer2:
      return 'Timer2';
    case SessionTerminationOptions.Timer3:
      return 'Timer3';
    default:
      // Handle special duration key (passed as string)
      if (typeof legacyType === 'string') {
        const findSpecialKey = keyset.SpecialDurationKeys.find((key) => legacyType.endsWith(key.KeyDescription));

        if (findSpecialKey) {
          return createSpecialTimerType(findSpecialKey.KeyName);
        }

        const findScoringKey = keyset.ScorableDurationKeys.find((key) => legacyType.endsWith(key.KeyDescription));

        if (findScoringKey) {
          return createSpecialTimerType(findScoringKey.KeyName);
        }

        return 'Total';
      }
      return 'Total';
  }
}

/**
 * Helper to create UnifiedTimerType from special duration key
 *
 * @param keyName - The name of the special duration key to use as timer
 * @return A UnifiedTimerType representing this special key timer
 */
export function createSpecialTimerType(keyName: string): UnifiedTimerType {
  return { type: 'Special', keyName };
}

/**
 * Convenience function for processing multiple sessions with filtered keys
 *
 * @param results - Array of session results to process
 * @param keyset - The keyset to use for processing
 * @param timerType - The unified timer type to use for processing
 * @param template - Optional pre-configured template for processing options
 * @param hidden - Optional object specifying keys to hide from results
 * @return An array of processed session data with keys filtered as specified
 */
export function identifyStrategyTimingStrategy(keyset: KeySet, timerType: UnifiedTimerType): ScoringStrategy {
  const isSpecialScoring = typeof timerType === 'object' && timerType.type === 'Special';

  if (isSpecialScoring) {
    const keyValue = timerType.keyName;

    const checkSpecialKey = keyset.SpecialDurationKeys.find((key) => key.KeyName === keyValue);
    if (checkSpecialKey) {
      return {
        special: true,
        schedule: 'system',
        keyset,
        timerType,
        specialKeyName: keyValue,
      };
    }

    const checkScoringKey = keyset.ScorableDurationKeys.find((key) => key.KeyName === keyValue);
    if (checkScoringKey) {
      return {
        special: true,
        schedule: 'duration',
        keyset,
        timerType,
        specialKeyName: keyValue,
      };
    }

    throw new Error(
      `Timer key "${keyValue}" not found in either SpecialDurationKeys or ScorableDurationKeys of the keyset.`,
    );
  }

  return {
    special: false,
    schedule: 'system',
    keyset, // Default schedule for non-special cases
    timerType,
  };
}
