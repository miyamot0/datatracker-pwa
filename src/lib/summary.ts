import { getLocalCachedPrefs } from '@/lib/local_storage';
import { ScheduleMappingOptions } from '@/types/schedules';
import { KeySet } from '@/types/keyset';
import { PlotPoint, ToggleDisplayKey } from '@/types/visuals';
import { ModifiedSessionResult } from '@/types/storage';
import { walkSessionFrequencyKey, walkSessionDurationKey } from './schedule-parser';
import { SavedSessionResult } from './dtos';
import { SessionTerminationOptionsType, SessionTerminationOptions } from '@/types/terminations';
import { evaluateLogic } from './logic';
import { EntryHolder, HumanReadableResultsRow } from '@/types/export';
import { Matrix, CellBase } from 'react-spreadsheet';

/**
 * Builds spreadsheet data for export based on session results and timer configuration
 *
 * @param results
 * @param sessionTimer
 * @returns
 * @deprecated
 */
export const buildSpreadsheetData = (
  results: HumanReadableResultsRow[],
  sessionTimer: SessionTerminationOptionsType,
): Matrix<CellBase<any>> => {
  return results.map((datum) => {
    const baseData = [
      { value: datum.Session.toString(), readOnly: true },
      { value: datum.Date.toLocaleDateString(), readOnly: true },
      { value: datum.Date.toLocaleTimeString(), readOnly: true },
      { value: datum.Condition.toString(), readOnly: true },
      { value: datum.DataCollector.toString(), readOnly: true },
      { value: datum.Therapist.toString(), readOnly: true },
      {
        value: getTimerValue(
          {
            TimerMain: datum.duration * 60,
            TimerOne: datum.Timer1 * 60,
            TimerTwo: datum.Timer2 * 60,
            TimerThree: datum.Timer3 * 60,
          } as SavedSessionResult,
          sessionTimer,
        ).toFixed(2),
        readOnly: true,
      },
    ];

    const valueData = datum.values.map((value) => ({
      value: value.Value.toString(),
      readOnly: true,
    }));

    return [...baseData, ...valueData];
  }) as Matrix<CellBase<any>>;
};

// Process observed keys for a session
export const processObservedKeys = (
  result: SavedSessionResult,
  sessionTimer: SessionTerminationOptionsType,
  keyset: KeySet,
  observedKeys: ToggleDisplayKey[],
): EntryHolder[] => {
  const minutes = getTimerValue(result, sessionTimer);
  const entries: EntryHolder[] = [];

  const keyData = keyset.FrequencyKeys.map((key) => ({
    Key: key.KeyDescription,
    KeyCode: key.KeyCode,
    Value: getFrequencyKeyValue(result, sessionTimer, key),
    Minutes: minutes,
  }));

  observedKeys.forEach((key) => {
    if (!key.Visible) return;

    const keyInfo = keyData.find((datum) => datum.KeyCode === key.KeyCode);
    if (!keyInfo) {
      throw new Error(`Key with KeyCode ${key.KeyCode} not found in current session data`);
    }

    // Add count and rate entries
    entries.push({ ...keyInfo, Value: keyInfo.Value.toString() });
    entries.push({ ...keyInfo, Value: (keyInfo.Value / minutes).toFixed(2) });
  });

  return entries;
};

// Process derived keys for a session
export const processDerivedKeys = (
  result: SavedSessionResult,
  sessionTimer: SessionTerminationOptionsType,
  keyset: KeySet,
  derivedKeys: ToggleDisplayKey[],
): EntryHolder[] => {
  const minutes = getTimerValue(result, sessionTimer);
  const entries: EntryHolder[] = [];

  const keyData = keyset.FrequencyKeys.map((key) => ({
    KeyCode: key.KeyCode,
    Value: getFrequencyKeyValue(result, sessionTimer, key),
    Minutes: minutes,
  }));

  derivedKeys.forEach((key) => {
    if (!key.Visible) return;

    const logicalState = keyset.DerivedKeys.find((derived) => derived.name === key.KeyName);
    if (!logicalState) {
      throw new Error(`Logical state not found for key ${key.KeyName}`);
    }

    const updatedFields = logicalState.fields.map((field) => {
      const foundKey = keyData.find((score) => score?.KeyCode === field.KeyCode);
      return {
        ...field,
        Value: foundKey ? foundKey.Value : NaN,
        Minutes: foundKey ? foundKey.Minutes : NaN,
      };
    });

    if (updatedFields.length < 1) return;

    const calculatedValue = evaluateLogic({ ...logicalState, fields: updatedFields });
    const rate = (calculatedValue / minutes).toFixed(2);

    entries.push({
      Key: key.KeyDescription,
      KeyCode: key.KeyCode,
      Value: calculatedValue.toString(),
    });

    entries.push({
      Key: key.KeyDescription,
      KeyCode: key.KeyCode,
      Value: rate,
    });
  });

  return entries;
};

/**
 * Build column labels for the spreadsheet
 *
 * @param sessionTimer
 * @param observedKeys
 * @param derivedKeys
 * @returns
 * @deprecated
 */
export const buildColumnLabels = (
  sessionTimer: SessionTerminationOptionsType,
  observedKeys: ToggleDisplayKey[],
  derivedKeys: ToggleDisplayKey[],
): string[] => {
  const timerLabel = getTimerLabel(sessionTimer);
  const baseLabels = [
    'Session #',
    'Date',
    'Time',
    'Condition',
    'Data Collector',
    'Therapist',
    `Duration ${timerLabel} (min)`,
  ];

  const observedLabels = observedKeys
    .filter((entry) => entry.Visible)
    .flatMap((entry) => [
      `${entry.KeyDescription} (${timerLabel} Count)`,
      `${entry.KeyDescription} (${timerLabel} Rate)`,
    ]);

  const derivedLabels = derivedKeys
    .filter((key) => key.Visible)
    .flatMap((key) => [`${key.KeyDescription} (Derived Count)`, `${key.KeyDescription} (Derived Rate)`]);

  return [...baseLabels, ...observedLabels, ...derivedLabels];
};

// Helper functions for timer-related operations
export const getTimerValue = (result: SavedSessionResult, sessionTimer: SessionTerminationOptionsType) => {
  switch (sessionTimer) {
    case SessionTerminationOptions.TimerMain:
      return result.TimerMain / 60;
    case SessionTerminationOptions.Timer1:
      return result.TimerOne / 60;
    case SessionTerminationOptions.Timer2:
      return result.TimerTwo / 60;
    case SessionTerminationOptions.Timer3:
      return result.TimerThree / 60;
    default:
      return result.TimerMain / 60;
  }
};

export const getTimerLabel = (sessionTimer: SessionTerminationOptionsType) => {
  switch (sessionTimer) {
    case SessionTerminationOptions.TimerMain:
      return 'Session';
    case SessionTerminationOptions.Timer1:
      return 'Timer #1';
    case SessionTerminationOptions.Timer2:
      return 'Timer #2';
    case SessionTerminationOptions.Timer3:
      return 'Timer #3';
    default:
      return 'Session';
  }
};

export const getFrequencyKeyValue = (
  result: SavedSessionResult,
  sessionTimer: SessionTerminationOptionsType,
  key: any,
) => {
  const primary = walkSessionFrequencyKey(result, 'Primary', key);
  const secondary = walkSessionFrequencyKey(result, 'Secondary', key);
  const tertiary = walkSessionFrequencyKey(result, 'Tertiary', key);

  switch (sessionTimer) {
    case SessionTerminationOptions.TimerMain:
      return [primary, secondary, tertiary].reduce((sum, a) => sum + a.Value, 0);
    case SessionTerminationOptions.Timer1:
      return primary.Value;
    case SessionTerminationOptions.Timer2:
      return secondary.Value;
    case SessionTerminationOptions.Timer3:
      return tertiary.Value;
    default:
      return [primary, secondary, tertiary].reduce((sum, a) => sum + a.Value, 0);
  }
};

export function prepareDataOrganization(Group: string, Individual: string, Evaluation: string, _KeySet: KeySet) {
  /* 
  // Note: All visible by default, then apply user preferences to hide keys as needed
  const enhancedKeySetF: EnhancedKeySetInstance[] = KeySet.FrequencyKeys.map((key) => ({
    ...key,
    Visible: true,
    Type: 'Key',
  }));
  const enhancedKeySetD: EnhancedKeySetInstance[] = KeySet.DurationKeys.map((key) => ({
    ...key,
    Visible: true,
    Type: 'Key',
  }));
  */

  // Pull stored preferences for both frequency and duration keys
  const stored_prefs_F = getLocalCachedPrefs(Group, Individual, Evaluation, 'Rate');
  /*
  const stored_prefs_D = getLocalCachedPrefs(Group, Individual, Evaluation, 'Duration');

  // Conditionally set these to false based on user preferences for both frequency and duration keys
  const baseUnfilteredKeysF = [...enhancedKeySetF].map((key) => {
    const should_disable = stored_prefs_F.KeyDescription.includes(key.KeyDescription);

    if (should_disable) {
      return {
        ...key,
        Visible: false,
      } satisfies EnhancedKeySetInstance;
    }

    return key;
  });
  const baseUnfilteredKeysD = enhancedKeySetD.map((key) => {
    const should_disable = stored_prefs_D.KeyDescription.includes(key.KeyDescription);

    if (should_disable) {
      return {
        ...key,
        Visible: false,
      } satisfies EnhancedKeySetInstance;
    }

    return key;
  });
  */

  const timerMapping =
    ScheduleMappingOptions.find((i) => i.value === stored_prefs_F?.Schedule) ?? ScheduleMappingOptions[0];

  return {
    //UnfilteredKeysFrequency: baseUnfilteredKeysF,
    //UnfilteredKeysDuration: baseUnfilteredKeysD,
    TimerMapping: timerMapping,
  };
}

/**
 * Prepares plot data for session visualization
 *
 * @param relevantSession - The session data to process
 * @returns Array of plot points with time series data
 */
export function preparePlotDataCumulative(relevantSession: ModifiedSessionResult): PlotPoint[] {
  const plot_object: PlotPoint[] = [];
  const keys = relevantSession.Keyset.FrequencyKeys.map((k: { KeyDescription: string }) => k.KeyDescription);

  // Create initial point at time 0
  const start_object: PlotPoint = { second: 0 };
  keys.forEach((k: string) => {
    start_object[k] = 0;
  });
  plot_object.push(start_object);

  // Reference object to track cumulative counts
  const reference_object = { ...start_object };

  // Process each key press to create time series data
  relevantSession.FrequencyKeyPresses.forEach((k: { KeyDescription: string; TimeIntoSession: number }) => {
    // Add point before increment
    const prev: PlotPoint = { second: Math.floor(k.TimeIntoSession) };
    keys.forEach((key: string) => {
      prev[key] = reference_object[key];
    });
    plot_object.push(prev);

    // Increment the specific key
    reference_object[k.KeyDescription] = reference_object[k.KeyDescription] + 1;

    // Add point after increment
    const curr: PlotPoint = { second: Math.floor(k.TimeIntoSession) };
    keys.forEach((key: string) => {
      curr[key] = reference_object[key];
    });
    plot_object.push(curr);
  });

  // Add final point at session end
  const final_object: PlotPoint = {
    ...reference_object,
    second: Math.floor(relevantSession.TimerMain),
  };
  plot_object.push(final_object);

  return plot_object;
}

// Process duration keys for a session
/**
 * Processes duration keys for a session based on timer configuration and user preferences
 *
 * @param result
 * @param sessionTimer
 * @param filteredKeys
 * @returns
 * @deprecated
 */
export const processDurationKeys = (
  result: SavedSessionResult,
  sessionTimer: SessionTerminationOptionsType,
  filteredKeys: ToggleDisplayKey[],
): EntryHolder[] => {
  const entries: EntryHolder[] = [];
  const timerValue = getTimerValue(result, sessionTimer);
  const timerSeconds = timerValue * 60;

  filteredKeys
    .filter((key) => key.Visible)
    .forEach((key) => {
      const primary = walkSessionDurationKey(result, 'Primary', key);
      const secondary = walkSessionDurationKey(result, 'Secondary', key);
      const tertiary = walkSessionDurationKey(result, 'Tertiary', key);
      const scoreBySchedule = [primary, secondary, tertiary];

      let duration: number;
      let percentage: number;
      let bouts: number;

      switch (sessionTimer) {
        case SessionTerminationOptions.TimerMain:
          duration = scoreBySchedule.reduce((sum, a) => sum + a.Value, 0);
          percentage = (duration / timerSeconds) * 100;
          bouts = scoreBySchedule.reduce((sum, a) => sum + a.Bouts, 0);
          break;
        case SessionTerminationOptions.Timer1:
          duration = primary.Value;
          percentage = (duration / result.TimerOne) * 100;
          bouts = primary.Bouts;
          break;
        case SessionTerminationOptions.Timer2:
          duration = secondary.Value;
          percentage = (duration / result.TimerTwo) * 100;
          bouts = secondary.Bouts;
          break;
        case SessionTerminationOptions.Timer3:
          duration = tertiary.Value;
          percentage = (duration / result.TimerThree) * 100;
          bouts = tertiary.Bouts;
          break;
        default:
          duration = scoreBySchedule.reduce((sum, a) => sum + a.Value, 0);
          percentage = (duration / timerSeconds) * 100;
          bouts = scoreBySchedule.reduce((sum, a) => sum + a.Bouts, 0);
      }

      const averageBoutLength = bouts > 0 ? duration / bouts : 0;

      // Add duration entries: seconds, percentage, bouts, average bout length
      entries.push({
        Key: key.KeyDescription,
        KeyCode: key.KeyCode,
        Value: duration.toFixed(2),
      });
      entries.push({
        Key: key.KeyDescription,
        KeyCode: key.KeyCode,
        Value: percentage.toFixed(2),
      });
      entries.push({
        Key: key.KeyDescription,
        KeyCode: key.KeyCode,
        Value: bouts.toString(),
      });
      entries.push({
        Key: key.KeyDescription,
        KeyCode: key.KeyCode,
        Value: averageBoutLength.toFixed(2),
      });
    });

  return entries;
};

/**
 * Builds column labels for duration spreadsheet based on timer configuration and visible keys
 *
 * @param sessionTimer
 * @param filteredKeys
 * @returns
 * @deprecated
 */
export const buildDurationColumnLabels = (
  sessionTimer: SessionTerminationOptionsType,
  filteredKeys: ToggleDisplayKey[],
): string[] => {
  const timerLabel = getTimerLabel(sessionTimer);
  const baseLabels = [
    'Session #',
    'Date',
    'Time',
    'Condition',
    'Data Collector',
    'Therapist',
    `Duration ${timerLabel} (min)`,
  ];

  const durationLabels = filteredKeys
    .filter((key) => key.Visible)
    .flatMap((key) => [
      `${key.KeyDescription} (${timerLabel === 'Session' ? 'Total' : timerLabel} Seconds)`,
      `${key.KeyDescription} (${timerLabel === 'Session' ? 'Total' : timerLabel} Percentage)`,
      `${key.KeyDescription} (${timerLabel === 'Session' ? 'Total' : timerLabel} Bouts)`,
      `${key.KeyDescription} (${timerLabel === 'Session' ? 'Total' : timerLabel} Average Bout Length)`,
    ]);

  return [...baseLabels, ...durationLabels];
};
