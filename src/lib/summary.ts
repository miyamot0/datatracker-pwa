import { getLocalCachedPrefs } from '@/lib/local_storage';
import { EnhancedKeySetInstance } from '@/types/keyset';
import { ScheduleMappingOptions } from '@/types/schedules';
import { KeySet } from '@/types/keyset';
import { PlotPoint } from '@/types/visuals';
import { ModifiedSessionResult } from '@/types/storage';

export function prepareDataOrganization(Group: string, Individual: string, Evaluation: string, KeySet: KeySet) {
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
  const ctbEntry = {
    KeyCode: -1,
    KeyDescription: 'CTB',
    KeyName: 'CTB',
    Visible: true,
    Type: 'Summary',
  } satisfies EnhancedKeySetInstance;

  // Pull stored preferences for both frequency and duration keys
  const stored_prefs_F = getLocalCachedPrefs(Group, Individual, Evaluation, 'Rate');
  const stored_prefs_D = getLocalCachedPrefs(Group, Individual, Evaluation, 'Duration');

  // Conditionally set these to false based on user preferences for both frequency and duration keys
  const baseUnfilteredKeysF = [...enhancedKeySetF, ctbEntry].map((key) => {
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

  // Note: Helper function for CTB
  const excludeFromCTB = baseUnfilteredKeysF.map((key) => {
    const should_disable = stored_prefs_F.CTBElements.includes(key.KeyDescription);
    if (should_disable) {
      return {
        ...key,
        Visible: false,
      } satisfies EnhancedKeySetInstance;
    }

    return key;
  });

  const timerMapping =
    ScheduleMappingOptions.find((i) => i.value === stored_prefs_F?.Schedule) ?? ScheduleMappingOptions[0];

  return {
    UnfilteredKeysFrequency: baseUnfilteredKeysF,
    UnfilteredKeysDuration: baseUnfilteredKeysD,
    TimerMapping: timerMapping,
    ExcludeFromCTB: excludeFromCTB,
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
