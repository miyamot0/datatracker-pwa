import { SavedSessionResult } from './dtos';
import { KeySet, KeySetInstance } from '@/types/keyset';
import { LogicState } from './logic';
import {
  CalculationTemplate,
  ProcessedSessionData,
  ScoringStrategy,
  SessionProcessingOptions,
  UnifiedTimerType,
} from '@/types/calculation';
import {
  getUnifiedTimerMinutes,
  getUnifiedTimerLabel,
  identifyStrategyTimingStrategy,
} from '@/lib/calculations/calculation-helpers';
import { processFrequencyKeys } from '@/lib/calculations/calculation-frequency';
import { processDurationKeys } from '@/lib/calculations/calculation-duration';
import { processDerivedKeys } from '@/lib/calculations/calculation-derived';

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
    timerDuration: getUnifiedTimerMinutes(result, options),
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
