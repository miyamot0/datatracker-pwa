import { type SeriesStyles } from '@/lib/graphing/series-style';
import { type FigureLabelSettings } from '@/lib/graphing/figure-labels';
import { type LegendSettings } from '@/lib/graphing/legend-settings';
import { type FigureVisualSizing } from '@/types/accessibility';
import { type ToggleDisplayCondition, type ToggleDisplayKey } from '@/types/visuals';

export type ScheduleOption = { value: string; label: string };

export type VisualsSettingsState = {
  keys: ToggleDisplayKey[];
  conditions: ToggleDisplayCondition[];
  schedule: ScheduleOption;
  figureTextSize: FigureVisualSizing;
  connectSpans: boolean;
  showTitle: boolean;
  showTooltip: boolean;
  showConditionLegend: boolean;
  showDescription: boolean;
  figureLabels: FigureLabelSettings;
  legendSettings: LegendSettings;
  seriesStyles: SeriesStyles;
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
  | { type: 'showDescriptionChanged'; show: boolean }
  | { type: 'figureLabelsChanged'; labels: FigureLabelSettings }
  | { type: 'legendSettingsChanged'; settings: LegendSettings }
  | { type: 'seriesStylesChanged'; styles: SeriesStyles };

/**
 * Pure state transitions for visualization settings. Toggles read the latest state, so rapid updates do not overwrite each other.
 */
export function visualsSettingsReducer(
  state: VisualsSettingsState,
  action: VisualsSettingsAction,
): VisualsSettingsState {
  switch (action.type) {
    case 'keyVisibilityChanged':
      return {
        ...state,
        keys: state.keys.map((key) =>
          key.KeyDescription === action.keyDescription ? { ...key, Visible: action.visible } : key,
        ),
      };
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
    case 'showDescriptionChanged':
      return { ...state, showDescription: action.show };
    case 'figureLabelsChanged':
      return { ...state, figureLabels: action.labels };
    case 'legendSettingsChanged':
      return { ...state, legendSettings: action.settings };
    case 'seriesStylesChanged':
      return { ...state, seriesStyles: action.styles };
  }
}
