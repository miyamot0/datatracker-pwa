import { type SeriesStyles } from '@/lib/graphing/series-style';
import { type FigureLabelSettings } from '@/lib/graphing/figure-labels';
import { type FigureAxisMaxSettings, type FigureFontFamily } from '@/lib/graphing/figure-text-settings';
import { type LegendSettings } from '@/lib/graphing/legend-settings';
import { type FigureVisualSizing } from '@/types/accessibility';
import { type ToggleDisplayCondition, type ToggleDisplayKey } from '@/types/visuals';

export type ScheduleOption = { value: string; label: string };

/** Style settings that are saved to local storage and can be reloaded from styles.json */
export type PersistedVisualsSettings = Pick<
  VisualsSettingsState,
  | 'connectSpans'
  | 'showTitle'
  | 'showTooltip'
  | 'showConditionLegend'
  | 'showKeyLegend'
  | 'showDescription'
  | 'singleTarget'
  | 'figureLabels'
  | 'legendSettings'
  | 'seriesStyles'
  | 'fontFamily'
  | 'axisMax'
>;

export type VisualsSettingsState = {
  keys: ToggleDisplayKey[];
  conditions: ToggleDisplayCondition[];
  schedule: ScheduleOption;
  figureTextSize: FigureVisualSizing;
  connectSpans: boolean;
  showTitle: boolean;
  showTooltip: boolean;
  showConditionLegend: boolean;
  showKeyLegend: boolean;
  showDescription: boolean;
  /** Requested single-target display; only takes effect while exactly one key is visible */
  singleTarget: boolean;
  figureLabels: FigureLabelSettings;
  legendSettings: LegendSettings;
  seriesStyles: SeriesStyles;
  fontFamily: FigureFontFamily;
  axisMax: FigureAxisMaxSettings;
};

export type VisualsSettingsAction =
  | { type: 'keyVisibilityChanged'; keyDescription: string; visible: boolean }
  | { type: 'conditionVisibilityChanged'; condition: string; visible: boolean }
  | { type: 'scheduleChanged'; schedule: ScheduleOption }
  | { type: 'figureTextSizeChanged'; size: FigureVisualSizing }
  | { type: 'connectSpansChanged'; connect: boolean }
  | { type: 'showTitleChanged'; show: boolean }
  | { type: 'showTooltipChanged'; show: boolean }
  | { type: 'showConditionLegendChanged'; show: boolean }
  | { type: 'showKeyLegendChanged'; show: boolean }
  | { type: 'showDescriptionChanged'; show: boolean }
  | { type: 'singleTargetChanged'; singleTarget: boolean }
  | { type: 'figureLabelsChanged'; labels: FigureLabelSettings }
  | { type: 'legendSettingsChanged'; settings: LegendSettings }
  | { type: 'seriesStylesChanged'; styles: SeriesStyles }
  | { type: 'fontFamilyChanged'; fontFamily: FigureFontFamily }
  | { type: 'axisMaxChanged'; axisMax: FigureAxisMaxSettings }
  | { type: 'settingsReloaded'; settings: PersistedVisualsSettings };

/**
 * Number of keys currently visible. Single-target display applies only when this is exactly one.
 */
export function countVisibleKeys(keys: ToggleDisplayKey[]): number {
  return keys.filter((key) => key.Visible === true).length;
}

/**
 * Pure state transitions for visualization settings. Toggles read the latest state, so rapid updates do not overwrite each other.
 */
export function visualsSettingsReducer(
  state: VisualsSettingsState,
  action: VisualsSettingsAction,
): VisualsSettingsState {
  switch (action.type) {
    case 'keyVisibilityChanged': {
      const keys = state.keys.map((key) =>
        key.KeyDescription === action.keyDescription ? { ...key, Visible: action.visible } : key,
      );

      // Single target is lifted once more than one key is enabled
      const lifted = countVisibleKeys(keys) > 1 && state.singleTarget;

      return { ...state, keys, ...(lifted ? { singleTarget: false } : {}) };
    }
    case 'conditionVisibilityChanged':
      return {
        ...state,
        conditions: state.conditions.map((condition) =>
          condition.Condition === action.condition ? { ...condition, Visible: action.visible } : condition,
        ),
      };
    case 'scheduleChanged':
      return { ...state, schedule: action.schedule };
    case 'figureTextSizeChanged':
      return { ...state, figureTextSize: action.size };
    case 'connectSpansChanged':
      return { ...state, connectSpans: action.connect };
    case 'showTitleChanged':
      return { ...state, showTitle: action.show };
    case 'showTooltipChanged':
      return { ...state, showTooltip: action.show };
    case 'showConditionLegendChanged':
      return { ...state, showConditionLegend: action.show };
    case 'showKeyLegendChanged':
      return { ...state, showKeyLegend: action.show };
    case 'showDescriptionChanged':
      return { ...state, showDescription: action.show };
    case 'singleTargetChanged':
      return { ...state, singleTarget: action.singleTarget };
    case 'figureLabelsChanged':
      return { ...state, figureLabels: action.labels };
    case 'legendSettingsChanged':
      return { ...state, legendSettings: action.settings };
    case 'seriesStylesChanged':
      return { ...state, seriesStyles: action.styles };
    case 'fontFamilyChanged':
      return { ...state, fontFamily: action.fontFamily };
    case 'axisMaxChanged':
      return { ...state, axisMax: action.axisMax };
    case 'settingsReloaded':
      return { ...state, ...action.settings };
  }
}
