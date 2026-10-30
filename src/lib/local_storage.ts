import { SessionTerminationOptionsType } from '@/types/terminations';
import {
  isValidPhaseChange,
  isValidTextAnnotation,
  isValidAimLine,
  type SeriesStyles,
} from '@/lib/graphing/series-style';
import {
  EMPTY_FIGURE_LABEL_SETTINGS,
  isValidFigureLabelSettings,
  type FigureLabelSettings,
} from '@/lib/graphing/figure-labels';
import {
  DEFAULT_LEGEND_SETTINGS,
  isValidLegendSettings,
  type LegendSettings,
} from '@/lib/graphing/legend-settings';
import {
  DEFAULT_FIGURE_FONT_FAMILY,
  EMPTY_FIGURE_AXIS_MAX_SETTINGS,
  isValidFigureAxisMaxSettings,
  isValidFigureFontFamily,
  type FigureAxisMaxSettings,
  type FigureFontFamily,
} from '@/lib/graphing/figure-text-settings';

/**
 * This is the type definition for the ReturnLocalStorageCache type
 */
export type ReturnLocalStorageCache = {
  KeyDescription: string[];
  Schedule: SessionTerminationOptionsType;
};

/**
 * This function retrieves cached preferences from local storage based on the provided parameters. If no cached information is found, it returns a default cache object.
 *
 */
const DEFAULT_LOCAL_STORAGE: ReturnLocalStorageCache = {
  KeyDescription: [],
  Schedule: 'End on Timer #1',
};

/**
 * Retrieve cached preferences from local storage based on the provided parameters. If no cached information is found, return a default cache object.
 *
 * @param Group
 * @param Individual
 * @param Evaluation
 * @param Type
 * @returns cached preferences object
 */
export function getLocalCachedPrefs(
  Group: string,
  Individual: string,
  Evaluation: string,
  Type: 'Rate' | 'Duration' | string,
) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), Type].join('_');

  const cached_information = localStorage.getItem(dynamic_key);

  const cached_information_object = cached_information ? JSON.parse(cached_information) : DEFAULT_LOCAL_STORAGE;

  return cached_information_object as ReturnLocalStorageCache;
}

/**
 * Store preferences in local storage based on the provided parameters and cache object.
 *
 * @param Group A string representing the group name
 * @param Individual A string representing the individual name
 * @param Evaluation A string representing the evaluation name
 * @param Type A string representing the type of preferences (e.g., 'Rate' or 'Duration')
 * @param Cache An object containing the preferences to be stored in local storage
 */
export function setLocalCachedPrefs(
  Group: string,
  Individual: string,
  Evaluation: string,
  Type: 'Rate' | 'Duration' | string,
  Cache: ReturnLocalStorageCache,
) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), Type].join('_');

  localStorage.setItem(dynamic_key, JSON.stringify(Cache));
}

/**
 * Retrieve saved series styles for a Group/Individual/Evaluation. Shared across figures. Returns empty styles when none are saved.
 */
export function getLocalSeriesStyles(Group: string, Individual: string, Evaluation: string): SeriesStyles {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'SeriesStyles'].join('_');

  const cached_information = localStorage.getItem(dynamic_key);

  if (!cached_information) {
    return { KeyStyles: {}, ConditionStyles: {}, phase_changes: [], text_annotations: [], aim_lines: [] };
  }

  const parsed = JSON.parse(cached_information) as Partial<SeriesStyles>;

  return {
    KeyStyles: parsed.KeyStyles ?? {},
    ConditionStyles: parsed.ConditionStyles ?? {},
    phase_changes: Array.isArray(parsed.phase_changes) ? parsed.phase_changes.filter(isValidPhaseChange) : [],
    text_annotations: Array.isArray(parsed.text_annotations)
      ? parsed.text_annotations.filter(isValidTextAnnotation)
      : [],
    aim_lines: Array.isArray(parsed.aim_lines) ? parsed.aim_lines.filter(isValidAimLine) : [],
  };
}

/**
 * Store series styles for a Group/Individual/Evaluation. Shared across figures.
 */
export function setLocalSeriesStyles(Group: string, Individual: string, Evaluation: string, Styles: SeriesStyles) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'SeriesStyles'].join('_');

  localStorage.setItem(dynamic_key, JSON.stringify(Styles));
}

/**
 * Retrieve whether a plot's title is shown for a Group/Individual/Evaluation. Defaults to shown when nothing valid is saved.
 */
export function getLocalShowTitle(Group: string, Individual: string, Evaluation: string, Plot: 'Rate' | 'Proportion') {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'ShowTitle', Plot].join('_');

  const cached_information = localStorage.getItem(dynamic_key);

  if (cached_information === 'false') {
    return false;
  }

  return true;
}

/**
 * Store whether a plot's title is shown for a Group/Individual/Evaluation.
 */
export function setLocalShowTitle(
  Group: string,
  Individual: string,
  Evaluation: string,
  Plot: 'Rate' | 'Proportion',
  ShowTitle: boolean,
) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'ShowTitle', Plot].join('_');

  localStorage.setItem(dynamic_key, String(ShowTitle));
}

/**
 * Retrieve whether chart tooltips are enabled for a Group/Individual/Evaluation. Defaults to enabled.
 */
export function getLocalShowTooltip(Group: string, Individual: string, Evaluation: string) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'ShowTooltip'].join('_');

  return localStorage.getItem(dynamic_key) !== 'false';
}

/**
 * Store whether chart tooltips are enabled for a Group/Individual/Evaluation.
 */
export function setLocalShowTooltip(Group: string, Individual: string, Evaluation: string, ShowTooltip: boolean) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'ShowTooltip'].join('_');

  localStorage.setItem(dynamic_key, String(ShowTooltip));
}

/**
 * Retrieve whether the condition entries of the legend are shown for a Group/Individual/Evaluation. Defaults to shown.
 */
export function getLocalShowConditionLegend(Group: string, Individual: string, Evaluation: string) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'ShowConditionLegend'].join('_');

  return localStorage.getItem(dynamic_key) !== 'false';
}

/**
 * Store whether the condition entries of the legend are shown for a Group/Individual/Evaluation.
 */
export function setLocalShowConditionLegend(
  Group: string,
  Individual: string,
  Evaluation: string,
  ShowConditionLegend: boolean,
) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'ShowConditionLegend'].join('_');

  localStorage.setItem(dynamic_key, String(ShowConditionLegend));
}

/**
 * Retrieve whether the explanation text above the figure is shown for a Group/Individual/Evaluation. Defaults to shown.
 */
export function getLocalShowDescription(Group: string, Individual: string, Evaluation: string) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'ShowDescription'].join('_');

  return localStorage.getItem(dynamic_key) !== 'false';
}

/**
 * Store whether the explanation text above the figure is shown for a Group/Individual/Evaluation.
 */
export function setLocalShowDescription(
  Group: string,
  Individual: string,
  Evaluation: string,
  ShowDescription: boolean,
) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'ShowDescription'].join('_');

  localStorage.setItem(dynamic_key, String(ShowDescription));
}

/**
 * Retrieve whether a plot's spans are connected for a Group/Individual/Evaluation. Defaults to not connected when nothing valid is saved.
 */
export function getLocalConnectSpans(
  Group: string,
  Individual: string,
  Evaluation: string,
  Plot: 'Rate' | 'Proportion',
) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'ConnectSpans', Plot].join('_');

  const cached_information = localStorage.getItem(dynamic_key);

  return cached_information === 'true';
}

/**
 * Store whether a plot's spans are connected for a Group/Individual/Evaluation.
 */
export function setLocalConnectSpans(
  Group: string,
  Individual: string,
  Evaluation: string,
  Plot: 'Rate' | 'Proportion',
  ConnectSpans: boolean,
) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'ConnectSpans', Plot].join('_');

  localStorage.setItem(dynamic_key, String(ConnectSpans));
}

/**
 * Retrieve the label overrides for a plot's figure. Defaults to no overrides when nothing valid is saved.
 */
export function getLocalFigureLabels(
  Group: string,
  Individual: string,
  Evaluation: string,
  Plot: 'Rate' | 'Proportion',
): FigureLabelSettings {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'FigureLabels', Plot].join('_');

  const cached_information = localStorage.getItem(dynamic_key);

  if (!cached_information) {
    return EMPTY_FIGURE_LABEL_SETTINGS;
  }

  try {
    const parsed: unknown = JSON.parse(cached_information);

    return isValidFigureLabelSettings(parsed) ? parsed : EMPTY_FIGURE_LABEL_SETTINGS;
  } catch {
    return EMPTY_FIGURE_LABEL_SETTINGS;
  }
}

/**
 * Store the label overrides for a plot's figure.
 */
export function setLocalFigureLabels(
  Group: string,
  Individual: string,
  Evaluation: string,
  Plot: 'Rate' | 'Proportion',
  Labels: FigureLabelSettings,
) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'FigureLabels', Plot].join('_');

  localStorage.setItem(dynamic_key, JSON.stringify(Labels));
}

/**
 * Retrieve the legend placement for a plot's figure. Defaults to the bottom, horizontal legend when nothing valid is saved.
 */
export function getLocalLegendSettings(
  Group: string,
  Individual: string,
  Evaluation: string,
  Plot: 'Rate' | 'Proportion',
): LegendSettings {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'LegendSettings', Plot].join('_');

  const cached_information = localStorage.getItem(dynamic_key);

  if (!cached_information) {
    return DEFAULT_LEGEND_SETTINGS;
  }

  try {
    const parsed: unknown = JSON.parse(cached_information);

    return isValidLegendSettings(parsed) ? parsed : DEFAULT_LEGEND_SETTINGS;
  } catch {
    return DEFAULT_LEGEND_SETTINGS;
  }
}

/**
 * Store the legend placement for a plot's figure.
 */
export function setLocalLegendSettings(
  Group: string,
  Individual: string,
  Evaluation: string,
  Plot: 'Rate' | 'Proportion',
  Settings: LegendSettings,
) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'LegendSettings', Plot].join('_');

  localStorage.setItem(dynamic_key, JSON.stringify(Settings));
}

/**
 * Retrieve the font family for a plot's figure. Defaults to the app font when nothing valid is saved.
 */
export function getLocalFigureFontFamily(
  Group: string,
  Individual: string,
  Evaluation: string,
  Plot: 'Rate' | 'Proportion',
): FigureFontFamily {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'FontFamily', Plot].join('_');

  const cached_information = localStorage.getItem(dynamic_key);

  if (!cached_information) {
    return DEFAULT_FIGURE_FONT_FAMILY;
  }

  try {
    const parsed: unknown = JSON.parse(cached_information);

    return isValidFigureFontFamily(parsed) ? parsed : DEFAULT_FIGURE_FONT_FAMILY;
  } catch {
    return DEFAULT_FIGURE_FONT_FAMILY;
  }
}

/**
 * Store the font family for a plot's figure.
 */
export function setLocalFigureFontFamily(
  Group: string,
  Individual: string,
  Evaluation: string,
  Plot: 'Rate' | 'Proportion',
  FontFamily: FigureFontFamily,
) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'FontFamily', Plot].join('_');

  localStorage.setItem(dynamic_key, JSON.stringify(FontFamily));
}

/**
 * Retrieve the maximum tick overrides for a plot's figure. Defaults to no overrides when nothing valid is saved.
 */
export function getLocalFigureAxisMax(
  Group: string,
  Individual: string,
  Evaluation: string,
  Plot: 'Rate' | 'Proportion',
): FigureAxisMaxSettings {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'AxisMax', Plot].join('_');

  const cached_information = localStorage.getItem(dynamic_key);

  if (!cached_information) {
    return EMPTY_FIGURE_AXIS_MAX_SETTINGS;
  }

  try {
    const parsed: unknown = JSON.parse(cached_information);

    return isValidFigureAxisMaxSettings(parsed) ? parsed : EMPTY_FIGURE_AXIS_MAX_SETTINGS;
  } catch {
    return EMPTY_FIGURE_AXIS_MAX_SETTINGS;
  }
}

/**
 * Store the maximum tick overrides for a plot's figure.
 */
export function setLocalFigureAxisMax(
  Group: string,
  Individual: string,
  Evaluation: string,
  Plot: 'Rate' | 'Proportion',
  AxisMax: FigureAxisMaxSettings,
) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), 'AxisMax', Plot].join('_');

  localStorage.setItem(dynamic_key, JSON.stringify(AxisMax));
}
