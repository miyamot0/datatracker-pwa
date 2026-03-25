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

/**
 * Unified timer type that handles all possible timer configurations
 */
export type UnifiedTimerType =
  | 'Total' // TimerMain - whole session
  | 'Timer1' // TimerOne - Primary schedule
  | 'Timer2' // TimerTwo - Secondary schedule
  | 'Timer3' // TimerThree - Tertiary schedule
  | { type: 'Special'; keyName: string }; // Special duration key timer

/**
 * Timer configuration for processing sessions
 */
export interface TimerConfig {
  timerType: UnifiedTimerType;
  includeRates?: boolean; // Calculate rates (per minute)
  includePercentages?: boolean; // Calculate percentages of total time
  includeBouts?: boolean; // Include bout information
}

/**
 * Processing options for session data
 */
export interface SessionProcessingOptions {
  timer: TimerConfig;
  keyTypes: {
    frequency: boolean;
    duration: boolean;
    derived: boolean;
  };
  outputFormat: 'spreadsheet' | 'chart' | 'raw';
}

/**
 * Gets timer value in seconds based on unified timer type
 *
 * @param result - The session result to process
 * @param timerType - The unified timer type
 * @return The timer value in seconds
 */
function getUnifiedTimerValue(result: SavedSessionResult, keyset: KeySet, timerType: UnifiedTimerType): number {
  if (typeof timerType === 'object' && timerType.type === 'Special') {
    return sumDurationSpecialKey(result, timerType.keyName);
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
      return result.TimerMain;
  }
}

/**
 * Gets timer value in minutes based on unified timer type
 *
 * @param result - The session result to process
 * @param timerType - The unified timer type
 * @return The timer value in minutes
 */
function getUnifiedTimerMinutes(result: SavedSessionResult, keyset: KeySet, timerType: UnifiedTimerType): number {
  if (typeof timerType === 'object' && timerType.type === 'Special') {
    // Pull from system presses
    const checkSpecialKey = keyset.SpecialDurationKeys.find((key) => key.KeyName === timerType.keyName);
    if (checkSpecialKey) {
      return sumDurationSpecialKey(result, timerType.keyName) / 60;
    }

    // Pull from duration presses
    const checkScoringKey = keyset.ScorableDurationKeys.find((key) => key.KeyName === timerType.keyName);
    if (checkScoringKey) {
      return sumDurationScoringKey(result, timerType.keyName) / 60;
    }
  }

  return getUnifiedTimerValue(result, keyset, timerType) / 60;
}

/**
 * Gets a user-friendly label for the timer based on unified timer type
 *
 * @param timerType - The unified timer type
 * @return A string label to display for this timer type
 */
function getUnifiedTimerLabel(timerType: UnifiedTimerType): string {
  if (typeof timerType === 'object' && timerType.type === 'Special') {
    return timerType.keyName;
  }

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
      return 'Session';
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
 * Standardized processed key result format for frequency, duration, and derived keys
 */
export interface ProcessedKeyResult {
  keyName: string;
  keyDescription: string;
  keyCode: number;
  keyType: 'Frequency' | 'Duration' | 'Derived';

  // Raw values
  rawValue: number;

  // Calculated values (populated based on options)
  rate?: number; // Per minute rate
  percentage?: number; // Percentage of total time
  bouts?: number; // Number of bouts
  averageBout?: number; // Average bout length

  // Visibility
  visible: boolean; // Whether this key should be displayed
}

/**
 * Processes frequency keys with unified timer system
 *
 * @param result - The session result to process
 * @param keys - The frequency keys to process
 * @param config - Timer configuration for calculations
 * @return An array of processed frequency key results
 */
function processFrequencyKeys(result: SavedSessionResult, keyset: KeySet, config: TimerConfig): ProcessedKeyResult[] {
  if (keyset.FrequencyKeys.length === 0) return [];

  const timerMinutes = getUnifiedTimerMinutes(result, keyset, config.timerType);

  return keyset.FrequencyKeys.map((key) => {
    let rawValue: number;

    if (config.timerType === 'Total') {
      const primary = walkSessionFrequencyKey(result, 'Primary', key);
      const secondary = walkSessionFrequencyKey(result, 'Secondary', key);
      const tertiary = walkSessionFrequencyKey(result, 'Tertiary', key);
      rawValue = primary.Value + secondary.Value + tertiary.Value;
    } else {
      const schedule = getTimerSchedule(config.timerType);

      const specialKey =
        typeof config.timerType === 'object' && config.timerType.type === 'Special'
          ? config.timerType.keyName
          : undefined;

      const keyResult = walkSessionFrequencyKey(result, schedule, key, specialKey);
      rawValue = keyResult.Value;
    }

    const processed: ProcessedKeyResult = {
      keyName: key.KeyName,
      keyDescription: key.KeyDescription,
      keyCode: key.KeyCode,
      keyType: 'Frequency',
      rawValue,
      visible: true, // TODO: Handle conditional display better
    };

    if (config.includeRates && timerMinutes > 0) {
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
function processDurationKeys(result: SavedSessionResult, keyset: KeySet, config: TimerConfig): ProcessedKeyResult[] {
  if (keyset.DurationKeys.length === 0) return [];

  const timerSeconds = getUnifiedTimerValue(result, keyset, config.timerType);

  return keyset.DurationKeys.map((key) => {
    let rawValue: number;
    let bouts: number;

    if (config.timerType === 'Total') {
      // For total timer, sum across all schedules
      const primary = walkSessionDurationKey(result, 'Primary', key);
      const secondary = walkSessionDurationKey(result, 'Secondary', key);
      const tertiary = walkSessionDurationKey(result, 'Tertiary', key);
      rawValue = primary.Value + secondary.Value + tertiary.Value;
      bouts = Math.max(primary.Bouts, secondary.Bouts, tertiary.Bouts, 0);
    } else {
      const schedule = getTimerSchedule(config.timerType);
      const keyResult = walkSessionDurationKey(result, schedule, key);
      rawValue = keyResult.Value;
      bouts = keyResult.Bouts;
    }

    const processed: ProcessedKeyResult = {
      keyName: key.KeyName,
      keyDescription: key.KeyDescription,
      keyCode: key.KeyCode,
      keyType: 'Duration',
      rawValue,
      visible: true, // TODO: Handle conditional display better
    };

    // Add calculated values based on config
    if (config.includePercentages && timerSeconds > 0) {
      processed.percentage = (rawValue / timerSeconds) * 100;
    }

    if (config.includeBouts) {
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
function processDerivedKeys(result: SavedSessionResult, keyset: KeySet, config: TimerConfig): ProcessedKeyResult[] {
  const derivedKeyset = keyset.DerivedKeys || [];
  const frequencyKeyset = keyset.FrequencyKeys || [];

  if (derivedKeyset.length === 0) return [];

  const timerMinutes = getUnifiedTimerMinutes(result, keyset, config.timerType);

  return derivedKeyset.map((derived) => {
    // First get the base frequency values for the derived key calculation
    const fieldValues = derived.fields.map((field) => {
      const foundKey = frequencyKeyset.find((key) => key.KeyCode === field.KeyCode);
      if (!foundKey) return { ...field, Value: NaN, Minutes: timerMinutes };

      let value: number;
      if (config.timerType === 'Total') {
        const primary = walkSessionFrequencyKey(result, 'Primary', foundKey);
        const secondary = walkSessionFrequencyKey(result, 'Secondary', foundKey);
        const tertiary = walkSessionFrequencyKey(result, 'Tertiary', foundKey);
        value = primary.Value + secondary.Value + tertiary.Value;
      } else {
        const schedule = getTimerSchedule(config.timerType);
        const keyResult = walkSessionFrequencyKey(result, schedule, foundKey);
        value = keyResult.Value;
      }

      return {
        ...field,
        Value: value,
        Minutes: timerMinutes,
      };
    });

    const updatedLogicState = { ...derived, fields: fieldValues };
    const rawValue = evaluateLogic(updatedLogicState);

    const processed: ProcessedKeyResult = {
      keyName: derived.name,
      keyDescription: derived.name,
      keyCode: typeof derived.id === 'number' ? derived.id : -999, // Ensure number type
      keyType: 'Derived',
      rawValue,
      visible: true, // TODO: Handle conditional display better
    };

    // Add calculated values based on config
    if (config.includeRates && timerMinutes > 0) {
      processed.rate = rawValue / timerMinutes;
    }

    return processed;
  });
}

/**
 * Complete processed session data
 */
export interface ProcessedSessionData {
  session: number;
  condition: string;
  date: Date;
  collector: string;
  therapist: string;
  timerType: UnifiedTimerType;
  timerLabel: string;
  timerDuration: number; // in minutes

  frequencyKeys: ProcessedKeyResult[];
  durationKeys: ProcessedKeyResult[];
  derivedKeys: ProcessedKeyResult[];
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
    timerLabel: getUnifiedTimerLabel(options.timer.timerType),
    timerDuration: getUnifiedTimerMinutes(result, keyset, options.timer.timerType),
    frequencyKeys: [],
    durationKeys: [],
    derivedKeys: [],
  };

  if (options.keyTypes.frequency && keyset.FrequencyKeys.length > 0) {
    processed.frequencyKeys = processFrequencyKeys(result, keyset, options.timer);
  }

  if (options.keyTypes.duration && keyset.DurationKeys.length > 0) {
    processed.durationKeys = processDurationKeys(result, keyset, options.timer);
  }

  // Note: We need all keys here even if not displaying, because derived keys may depend on any of the frequency keys
  if (options.keyTypes.derived) {
    processed.derivedKeys = processDerivedKeys(result, keyset, options.timer);
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

  //const timerEnd = sampleData.timerLabel;

  sampleData.frequencyKeys.forEach((key) => {
    headers.push(`${key.keyDescription} (Count)`);
    if (key.rate !== undefined) headers.push(`${key.keyDescription} (Rate)`);
  });

  sampleData.durationKeys.forEach((key) => {
    headers.push(`${key.keyDescription} (Seconds)`);
    if (key.percentage !== undefined) headers.push(`${key.keyDescription} (Percentage)`);
    if (key.bouts !== undefined) headers.push(`${key.keyDescription} (Bouts)`);
    if (key.averageBout !== undefined) headers.push(`${key.keyDescription} (Avg Bout)`);
  });

  sampleData.derivedKeys.forEach((key) => {
    headers.push(`${key.keyDescription} (Derived)`);
    if (key.rate !== undefined) headers.push(`${key.keyDescription} (Derived Rate)`);
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
      if (key.rate !== undefined) row.push(key.rate.toFixed(2));
    });

    // Add duration data (all keys are already visible)
    sessionData.durationKeys.forEach((key) => {
      row.push(key.rawValue.toFixed(2));
      if (key.percentage !== undefined) row.push(key.percentage.toFixed(2));
      if (key.bouts !== undefined) row.push(key.bouts.toString());
      if (key.averageBout !== undefined) row.push(key.averageBout.toFixed(2));
    });

    // Add derived data (all keys are already visible)
    sessionData.derivedKeys.forEach((key) => {
      row.push(key.rawValue.toString());
      if (key.rate !== undefined) row.push(key.rate.toFixed(2));
    });

    return row;
  });

  return [headers, ...rows];
}

/**
 * Chart data point interface
 */
export interface ChartDataPoint {
  session: number;
  condition: string;
  sessionTime: number;
  [key: string]: string | number; // Dynamic properties for key values
}

// ============================================================================
// PRE-BUILT PROCESSING TEMPLATES
// ============================================================================

/**
 * Pre-configured options for common use cases
 */
export const PROCESSING_TEMPLATES = {
  FREQUENCY_RATES: (timerType: UnifiedTimerType): SessionProcessingOptions => ({
    timer: { timerType, includeRates: true },
    keyTypes: { frequency: true, duration: false, derived: true },
    outputFormat: 'chart',
  }),

  DURATION_PERCENTAGES: (timerType: UnifiedTimerType): SessionProcessingOptions => ({
    timer: { timerType, includePercentages: true, includeBouts: true },
    keyTypes: { frequency: false, duration: true, derived: false },
    outputFormat: 'chart',
  }),

  SPREADSHEET_ALL: (timerType: UnifiedTimerType): SessionProcessingOptions => ({
    timer: { timerType, includeRates: true, includePercentages: true, includeBouts: true },
    keyTypes: { frequency: true, duration: true, derived: true },
    outputFormat: 'spreadsheet',
  }),

  CHART_ALL: (timerType: UnifiedTimerType): SessionProcessingOptions => ({
    timer: { timerType, includeRates: true, includePercentages: true, includeBouts: true },
    keyTypes: { frequency: true, duration: true, derived: true },
    outputFormat: 'chart',
  }),
} as const;

// ============================================================================
// CONVENIENCE HELPER FUNCTIONS
// ============================================================================

export type CalculationTemplate = 'FREQUENCY_RATES' | 'DURATION_PERCENTAGES' | 'SPREADSHEET_ALL' | 'CHART_ALL';

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
  const processOptions = PROCESSING_TEMPLATES[template](timerType);

  return results.map((result) => {
    const modifiedResult = {
      ...result,
      Keyset: keyset,
    };

    return processSessionData(modifiedResult, processOptions, keyset, hidden);
  });
}
