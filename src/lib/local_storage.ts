import { SessionTerminationOptionsType } from '@/types/terminations';

/**
 * This is the type definition for the ReturnLocalStorageCache type
 */
export type ReturnLocalStorageCache = {
  KeyDescription: string[];
  CTBElements: string[];
  Schedule: SessionTerminationOptionsType;
};

/**
 * This function retrieves cached preferences from local storage based on the provided parameters. If no cached information is found, it returns a default cache object.
 *
 */
const DEFAULT_LOCAL_STORAGE: ReturnLocalStorageCache = {
  KeyDescription: [],
  CTBElements: [],
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
