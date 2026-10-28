import { useEffect, useReducer, useRef } from 'react';
import {
  getLocalConnectSpans,
  getLocalFigureLabels,
  getLocalLegendSettings,
  getLocalSeriesStyles,
  getLocalShowConditionLegend,
  getLocalShowDescription,
  getLocalShowTitle,
  getLocalShowTooltip,
  setLocalCachedPrefs,
  setLocalConnectSpans,
  setLocalFigureLabels,
  setLocalLegendSettings,
  setLocalSeriesStyles,
  setLocalShowConditionLegend,
  setLocalShowDescription,
  setLocalShowTitle,
  setLocalShowTooltip,
} from '@/lib/local_storage';
import { type ToggleDisplayKey } from '@/types/visuals';
import { visualsSettingsReducer, type PersistedVisualsSettings, type ScheduleOption } from './visuals-settings-reducer';

export type VisualsSettingsOptions = {
  group: string;
  individual: string;
  evaluation: string;
  /** Storage label for plot-specific settings (titles, labels, legend, connected spans) */
  plot: 'Rate' | 'Proportion';
  /** Cache scope for hidden keys and schedule; each route reads its own scope */
  prefsType: 'Rate' | 'Duration';
  keys: ToggleDisplayKey[];
  conditions: string[];
  defaultSchedule: ScheduleOption;
};

/**
 * Reads the style-related settings that are persisted in local storage for this page's plot.
 */
export function readPersistedVisualsSettings(
  options: Pick<VisualsSettingsOptions, 'group' | 'individual' | 'evaluation' | 'plot'>,
): PersistedVisualsSettings {
  const { group, individual, evaluation, plot } = options;

  return {
    connectSpans: getLocalConnectSpans(group, individual, evaluation, plot),
    showTitle: getLocalShowTitle(group, individual, evaluation, plot),
    showTooltip: getLocalShowTooltip(group, individual, evaluation),
    showConditionLegend: getLocalShowConditionLegend(group, individual, evaluation),
    showDescription: getLocalShowDescription(group, individual, evaluation),
    figureLabels: getLocalFigureLabels(group, individual, evaluation, plot),
    legendSettings: getLocalLegendSettings(group, individual, evaluation, plot),
    seriesStyles: getLocalSeriesStyles(group, individual, evaluation),
  };
}

function buildInitialState(options: VisualsSettingsOptions): VisualsSettingsState {
  return {
    keys: [...options.keys].sort((a, b) => b.KeyType.localeCompare(a.KeyType)),
    conditions: options.conditions.map((condition) => ({ Condition: condition, Visible: true })),
    schedule: options.defaultSchedule,
    figureTextSize: 'base',
    ...readPersistedVisualsSettings(options),
  };
}

/**
 * Calls persist whenever value changes after mount. The first render is skipped so that loading settings never rewrites them.
 */
function usePersistOnChange<T>(value: T, persist: (next: T) => void) {
  const previous = useRef(value);

  useEffect(() => {
    if (Object.is(previous.current, value)) {
      return;
    }

    previous.current = value;
    persist(value);
  }, [value, persist]);
}

/**
 * Owns visualization settings for a results page: hydrates from local storage and persists each setting when it changes.
 */
export function useVisualsSettings(options: VisualsSettingsOptions) {
  const [state, dispatch] = useReducer(visualsSettingsReducer, options, buildInitialState);
  const { group, individual, evaluation, plot, prefsType } = options;

  usePersistOnChange(state.connectSpans, (connect) =>
    setLocalConnectSpans(group, individual, evaluation, plot, connect),
  );
  usePersistOnChange(state.showTitle, (show) => setLocalShowTitle(group, individual, evaluation, plot, show));
  usePersistOnChange(state.showTooltip, (show) => setLocalShowTooltip(group, individual, evaluation, show));
  usePersistOnChange(state.showConditionLegend, (show) =>
    setLocalShowConditionLegend(group, individual, evaluation, show),
  );
  usePersistOnChange(state.showDescription, (show) => setLocalShowDescription(group, individual, evaluation, show));
  usePersistOnChange(state.figureLabels, (labels) => setLocalFigureLabels(group, individual, evaluation, plot, labels));
  usePersistOnChange(state.legendSettings, (settings) =>
    setLocalLegendSettings(group, individual, evaluation, plot, settings),
  );
  usePersistOnChange(state.seriesStyles, (styles) => setLocalSeriesStyles(group, individual, evaluation, styles));
  usePersistOnChange(state.keys, (keys) =>
    setLocalCachedPrefs(group, individual, evaluation, prefsType, {
      KeyDescription: keys.filter((key) => key.Visible === false).map((key) => key.KeyDescription),
      Schedule: state.schedule.value,
    }),
  );

  return [state, dispatch] as const;
}
