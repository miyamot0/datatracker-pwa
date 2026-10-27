import { SessionTerminationOptionsType } from '@/types/terminations';
import {
  isValidPhaseChange,
  isValidTextAnnotation,
  isValidAimLine,
  type SeriesStyles,
} from '@/lib/graphing/series-style';

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
