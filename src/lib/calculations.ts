import { SavedSessionResult } from './dtos';
import {
  walkSessionFrequencyKey,
  walkSessionDurationKey,
  sumDurationSpecialKey,
  sumDurationScoringKey,
} from './schedule-parser';
import { SessionTerminationOptionsType, SessionTerminationOptions } from '@/types/terminations';
import { KeyTiming } from '@/types/timing';
import { KeySet, KeySetInstance } from '@/types/keyset';
import { evaluateLogic, LogicState } from './logic';
import {
  CalculationTemplate,
  ProcessedKeyResult,
  ProcessedSessionData,
  ScoringStrategy,
  SessionProcessingOptions,
  UnifiedTimerType,
} from '@/types/calculations';

/**
 * Gets timer value in seconds based on unified timer type
 *
 * @param result - The session result to process
 * @param timerType - The unified timer type
 * @return The timer value in seconds
 */
function getUnifiedTimerValue(result: SavedSessionResult, keyset: KeySet, options: SessionProcessingOptions): number {
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
function getUnifiedTimerMinutes(result: SavedSessionResult, keyset: KeySet, options: SessionProcessingOptions): number {
  return getUnifiedTimerValue(result, keyset, options) / 60;
}

/**
 * Gets a user-friendly label for the timer based on unified timer type
 *
 * @param timerType - The unified timer type
 * @return A string label to display for this timer type
 */
function getUnifiedTimerLabel(options: SessionProcessingOptions): string {
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
function getTimerSchedule(timerType: UnifiedTimerType): KeyTiming {
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
 * Processes frequency keys with unified timer system
 *
 * @param result - The session result to process
 * @param keys - The frequency keys to process
 * @param config - Timer configuration for calculations
 * @return An array of processed frequency key results
 */
function processFrequencyKeys(
  result: SavedSessionResult,
  keyset: KeySet,
  options: SessionProcessingOptions,
): ProcessedKeyResult[] {
  if (keyset.FrequencyKeys.length === 0) return [];

  const timerMinutes = getUnifiedTimerMinutes(result, keyset, options);

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

/**
 * Processes duration keys with unified timer system
 *
 * @param result - The session result to process
 * @param keys - The duration keys to process
 * @param config - Timer configuration for calculations
 * @return An array of processed duration key results
 */
function processDurationKeys(
  result: SavedSessionResult,
  keyset: KeySet,
  options: SessionProcessingOptions,
): ProcessedKeyResult[] {
  if (keyset.DurationKeys.length === 0) return [];

  const timerSeconds = getUnifiedTimerValue(result, keyset, options);

  return keyset.DurationKeys.map((key) => {
    let rawValue: number = NaN;
    let bouts: number | undefined = undefined;

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
      const keyResult = walkSessionDurationKey(result, 'Special', key);
      // TODO: This needs to walk to correct key press list
      rawValue = keyResult.Value;
      bouts = keyResult.Bouts;
    } else if (options.strategy.special && options.strategy.schedule === 'duration') {
      // TODO: This needs to walk to correct key press list
      const keyResult = walkSessionDurationKey(result, 'Special', key);
      rawValue = keyResult.Value;
      bouts = keyResult.Bouts;
      // Duration special - just sum the scoring key as duration
    } else {
      switch (options.timer.timerType) {
        case 'Total':
          const keyResult = walkSessionDurationKey(result, 'Primary', key);

          rawValue = keyResult.Value;
          bouts = keyResult.Bouts;
          break;
        case 'Timer1':
        case 'Timer2':
        case 'Timer3':
          const schedule = getTimerSchedule(options.timer.timerType);
          const keyResult2 = walkSessionDurationKey(result, schedule, key);
          rawValue = keyResult2.Value;
          bouts = keyResult2.Bouts;
          break;
        default:
          throw new Error('Invalid timer type for duration key processing');
      }
    }
    /**
    if (options.timer.timerType === 'Total') {
      // For total timer, sum across all schedules
      const primary = walkSessionDurationKey(result, 'Primary', key);
      const secondary = walkSessionDurationKey(result, 'Secondary', key);
      const tertiary = walkSessionDurationKey(result, 'Tertiary', key);
      rawValue = primary.Value + secondary.Value + tertiary.Value;
      bouts = Math.max(primary.Bouts, secondary.Bouts, tertiary.Bouts, 0);
    } else {
      const schedule = getTimerSchedule(options.timer.timerType);
      const keyResult = walkSessionDurationKey(result, schedule, key);
      rawValue = keyResult.Value;
      bouts = keyResult.Bouts;
    }
 */

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

/**
 * Processes derived keys with unified timer system
 *
 * @param result - The session result to process
 * @param derivedKeys - The derived keys to process
 * @param frequencyKeys - The frequency keys (needed for derived key calculations)
 * @param config - Timer configuration for calculations
 * @return An array of processed derived key results
 */
function processDerivedKeys(
  result: SavedSessionResult,
  keyset: KeySet,
  options: SessionProcessingOptions,
  frequencyResults: ProcessedKeyResult[],
): ProcessedKeyResult[] {
  const derivedKeyset = keyset.DerivedKeys || [];
  const frequencyKeyset = keyset.FrequencyKeys || [];

  if (derivedKeyset.length === 0 || frequencyKeyset.length === 0) return [];

  const timerMinutes = getUnifiedTimerMinutes(result, keyset, options);

  return derivedKeyset.map((derived) => {
    // First get the base frequency values for the derived key calculation
    const fieldValues = derived.fields.map((field) => {
      const foundKey = frequencyKeyset.find((key) => key.KeyCode === field.KeyCode);

      if (!foundKey) return { ...field, Value: NaN, Minutes: timerMinutes };

      const keyResult = frequencyResults.find((res) => res.keyCode === foundKey.KeyCode);

      if (!keyResult) return { ...field, Value: NaN, Minutes: timerMinutes };

      return {
        ...field,
        Value: keyResult.rawValue,
        Minutes: timerMinutes,
      };
    });

    //console.log();
    //console.log(`Session: ${result.SessionSettings.Session}, Derived Key: ${derived.name}`);
    //console.log(fieldValues);

    const updatedLogicState = { ...derived, fields: fieldValues };
    const rawValue = evaluateLogic(updatedLogicState);

    //console.log(updatedLogicState);

    const processed: ProcessedKeyResult = {
      keyName: derived.name,
      keyDescription: derived.name,
      keyCode: typeof derived.id === 'number' ? derived.id : -999, // Ensure number type
      keyType: 'Derived',
      rawValue,
      visible: true, // TODO: Handle conditional display better
    };

    // Add calculated values based on options
    if (options.timer.includeRates && timerMinutes > 0) {
      processed.rate = rawValue / timerMinutes;
    }

    return processed;
  });
}

/**
 * Processes a single session with unified system
 */
function processSessionData(
  result: SavedSessionResult,
  options: SessionProcessingOptions,
  keyset: KeySet,
  hidden?: {
    frequencyKeys: KeySetInstance[];
    durationKeys: KeySetInstance[];
    derivedKeys: LogicState[];
  },
): ProcessedSessionData {
  const processed: ProcessedSessionData = {
    session: result.SessionSettings.Session,
    condition: result.SessionSettings.Condition,
    date: new Date(result.SessionStart),
    collector: result.SessionSettings.Initials,
    therapist: result.SessionSettings.Therapist,
    timerType: options.timer.timerType,
    timerLabel: getUnifiedTimerLabel(options),
    timerDuration: getUnifiedTimerMinutes(result, keyset, options),
    frequencyKeys: [],
    durationKeys: [],
    derivedKeys: [],
  };

  if (options.keyTypes.frequency && keyset.FrequencyKeys.length > 0) {
    processed.frequencyKeys = processFrequencyKeys(result, keyset, options);
  }

  if (options.keyTypes.duration && keyset.DurationKeys.length > 0) {
    processed.durationKeys = processDurationKeys(result, keyset, options);
  }

  // Note: We need all keys here even if not displaying, because derived keys may depend on any of the frequency keys
  if (options.keyTypes.derived) {
    processed.derivedKeys = processDerivedKeys(result, keyset, options, processed.frequencyKeys);
  }

  // TODO: Handle this more cleanly in initial proc?
  if (hidden) {
    processed.frequencyKeys = processed.frequencyKeys.filter(
      (key) => !hidden.frequencyKeys.some((hiddenKey) => hiddenKey.KeyCode === key.keyCode),
    );
    processed.durationKeys = processed.durationKeys.filter(
      (key) => !hidden.durationKeys.some((hiddenKey) => hiddenKey.KeyCode === key.keyCode),
    );
    processed.derivedKeys = processed.derivedKeys.filter(
      (key) => !hidden.derivedKeys.some((hiddenKey) => hiddenKey.name === key.keyName),
    );
  }

  return processed;
}

/**
 * Processes multiple sessions with unified system
export function processMultipleSessionData(
  results: SavedSessionResult[],
  options: SessionProcessingOptions,
): ProcessedSessionData[] {
  return results.map((result) => processSessionData(result, options));
}
 */

// ============================================================================
// COMPATIBILITY HELPERS (LEGACY SUPPORT)
// ============================================================================

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
function createSpecialTimerType(keyName: string): UnifiedTimerType {
  return { type: 'Special', keyName };
}

/**
 * Formats processed data for spreadsheet display
 *
 * @param data - The array of processed session data to format
 * @return A 2D array of strings representing the spreadsheet matrix, including headers and data rows
 */
export function formatForSpreadsheet(data: ProcessedSessionData[]): string[][] {
  if (data.length === 0) return [];

  // Build header row
  const baseHeaders = [
    'Session #',
    'Date',
    'Time',
    'Condition',
    'Data Collector',
    'Therapist',
    `Timer`,
    `Duration (min)`,
  ];

  // Add dynamic headers based on processed keys (already filtered)
  const sampleData = data[0];
  const headers = [...baseHeaders];

  console.log(data);

  //const timerEnd = sampleData.timerLabel;

  sampleData.frequencyKeys.forEach((key) => {
    headers.push(`${key.keyDescription} (Count)`);
    headers.push(`${key.keyDescription} (Rate)`);
  });

  sampleData.durationKeys.forEach((key) => {
    headers.push(`${key.keyDescription} (Seconds)`);
    headers.push(`${key.keyDescription} (Percentage)`);
    headers.push(`${key.keyDescription} (Bouts)`);
    headers.push(`${key.keyDescription} (Avg Bout)`);
  });

  sampleData.derivedKeys.forEach((key) => {
    headers.push(`${key.keyDescription} (Derived)`);
    headers.push(`${key.keyDescription} (Derived Rate)`);
  });

  // Build data rows
  const rows = data.map((sessionData) => {
    const row = [
      sessionData.session.toString(),
      sessionData.date.toLocaleDateString(),
      sessionData.date.toLocaleTimeString(),
      sessionData.condition,
      sessionData.collector,
      sessionData.therapist,
      sessionData.timerLabel,
      sessionData.timerDuration.toFixed(2),
    ];

    // Add frequency data (all keys are already visible)
    sessionData.frequencyKeys.forEach((key) => {
      row.push(key.rawValue.toString());
      row.push(key.rate?.toFixed(2) ?? NaN.toString());
    });

    // Add duration data (all keys are already visible)
    sessionData.durationKeys.forEach((key) => {
      row.push(key.rawValue.toFixed(2));
      row.push(key.percentage?.toFixed(2) ?? NaN.toString());
      row.push(key.bouts?.toString() ?? NaN.toString());
      row.push(key.averageBout?.toFixed(2) ?? NaN.toString());
    });

    // Add derived data (all keys are already visible)
    sessionData.derivedKeys.forEach((key) => {
      row.push(key.rawValue.toString());
      row.push(key.rate?.toFixed(2) ?? NaN.toString());
    });

    return row;
  });

  return [headers, ...rows];
}

// ============================================================================
// PRE-BUILT PROCESSING TEMPLATES
// ============================================================================

/**
 * Pre-configured options for common use cases
 */
export const PROCESSING_TEMPLATES = {
  FREQUENCY_RATES: (timerType: UnifiedTimerType, strategy: ScoringStrategy): SessionProcessingOptions => ({
    timer: { timerType, includeRates: true },
    keyTypes: { frequency: true, duration: false, derived: true },
    strategy,
    outputFormat: 'chart',
  }),

  DURATION_PERCENTAGES: (timerType: UnifiedTimerType, strategy: ScoringStrategy): SessionProcessingOptions => ({
    timer: { timerType, includePercentages: true, includeBouts: true },
    keyTypes: { frequency: false, duration: true, derived: false },
    strategy,
    outputFormat: 'chart',
  }),

  SPREADSHEET_ALL: (timerType: UnifiedTimerType, strategy: ScoringStrategy): SessionProcessingOptions => ({
    timer: { timerType, includeRates: true, includePercentages: true, includeBouts: true },
    keyTypes: { frequency: true, duration: true, derived: true },
    strategy,
    outputFormat: 'spreadsheet',
  }),

  CHART_ALL: (timerType: UnifiedTimerType, strategy: ScoringStrategy): SessionProcessingOptions => ({
    timer: { timerType, includeRates: true, includePercentages: true, includeBouts: true },
    keyTypes: { frequency: true, duration: true, derived: true },
    strategy,
    outputFormat: 'chart',
  }),
} as const;

// ============================================================================
// CONVENIENCE HELPER FUNCTIONS
// ============================================================================

function identifyStrategyTimingStrategy(keyset: KeySet, timerType: UnifiedTimerType): ScoringStrategy {
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
      };
    }

    const checkScoringKey = keyset.ScorableDurationKeys.find((key) => key.KeyName === keyValue);
    if (checkScoringKey) {
      return {
        special: true,
        schedule: 'duration',
        keyset,
        timerType,
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

/**
 * Convenience function for processing multiple sessions with filtered keys
 */
export function processMultipleSessionDataWithKeys(
  results: SavedSessionResult[],
  keyset: KeySet,
  timerType: UnifiedTimerType,
  template: CalculationTemplate = 'SPREADSHEET_ALL',
  hidden?: {
    frequencyKeys: KeySetInstance[];
    durationKeys: KeySetInstance[];
    derivedKeys: LogicState[];
  },
): ProcessedSessionData[] {
  const processOptions = PROCESSING_TEMPLATES[template](timerType, identifyStrategyTimingStrategy(keyset, timerType));

  return results.map((result) => {
    const modifiedResult = {
      ...result,
      Keyset: keyset,
    };

    return processSessionData(modifiedResult, processOptions, keyset, hidden);
  });
}
