import { type TextPage } from '@/lib/graphing/series-style';

/**
 * User overrides for a figure's labels. Each text is only used when its override flag is set and it is not blank.
 */
export type FigureLabelSettings = {
  overrideTitle: boolean;
  titleText: string;
  overrideXAxis: boolean;
  xAxisText: string;
  overrideYAxis: boolean;
  yAxisText: string;
};

export type FigureLabels = {
  title: string;
  xAxis: string;
  yAxis: string;
};

export const FIGURE_LABEL_DEFAULTS: Record<TextPage, FigureLabels> = {
  rate: {
    title: 'Visualization of Data as Rates',
    xAxis: 'Session',
    yAxis: 'Responses per Min',
  },
  proportion: {
    title: 'Visualization of Data as Proportion of Session',
    xAxis: 'Session',
    yAxis: 'Percentage of Session',
  },
};

export const EMPTY_FIGURE_LABEL_SETTINGS: FigureLabelSettings = {
  overrideTitle: false,
  titleText: '',
  overrideXAxis: false,
  xAxisText: '',
  overrideYAxis: false,
  yAxisText: '',
};

/**
 * Checks that a stored value has the shape of FigureLabelSettings.
 */
export function isValidFigureLabelSettings(value: unknown): value is FigureLabelSettings {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.overrideTitle === 'boolean' &&
    typeof candidate.titleText === 'string' &&
    typeof candidate.overrideXAxis === 'boolean' &&
    typeof candidate.xAxisText === 'string' &&
    typeof candidate.overrideYAxis === 'boolean' &&
    typeof candidate.yAxisText === 'string'
  );
}

/**
 * Picks the label to show: the override text when it is enabled and not blank, otherwise the default.
 */
function pickLabel(override: boolean, text: string, fallback: string): string {
  const trimmed = text.trim();

  return override && trimmed !== '' ? trimmed : fallback;
}

/**
 * Resolves the labels a figure should draw, falling back to the defaults for anything not overridden.
 */
export function resolveFigureLabels(settings: FigureLabelSettings, defaults: FigureLabels): FigureLabels {
  return {
    title: pickLabel(settings.overrideTitle, settings.titleText, defaults.title),
    xAxis: pickLabel(settings.overrideXAxis, settings.xAxisText, defaults.xAxis),
    yAxis: pickLabel(settings.overrideYAxis, settings.yAxisText, defaults.yAxis),
  };
}
