import { SavedSessionResult } from '@/lib/dtos';
import { evaluateLogic } from '@/lib/logic';
import { KeySet } from '@/types/keyset';
import { getUnifiedTimerMinutes } from './calculation-helpers';
import { SessionProcessingOptions, ProcessedKeyResult } from '../../types/calculation';

/**
 * Processes derived keys with unified timer system
 *
 * @param result - The session result to process
 * @param derivedKeys - The derived keys to process
 * @param frequencyKeys - The frequency keys (needed for derived key calculations)
 * @param config - Timer configuration for calculations
 * @return An array of processed derived key results
 */
export function processDerivedKeys(
  result: SavedSessionResult,
  keyset: KeySet,
  options: SessionProcessingOptions,
  frequencyResults: ProcessedKeyResult[],
): ProcessedKeyResult[] {
  const derivedKeyset = keyset.DerivedKeys || [];
  const frequencyKeyset = keyset.FrequencyKeys || [];

  if (derivedKeyset.length === 0 || frequencyKeyset.length === 0) return [];

  const timerMinutes = getUnifiedTimerMinutes(result, options);

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

    // Add calculated values based on options
    if (options.timer.includeRates && timerMinutes > 0) {
      processed.rate = rawValue / timerMinutes;
    }

    return processed;
  });
}
