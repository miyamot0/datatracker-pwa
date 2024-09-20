import { SessionTerminationOptionsType } from '@/forms/schema/session-designer-schema';

export type ReturnLocalStorageCache = {
  KeyDescription: string[];
  CTBElements: string[];
  Schedule: SessionTerminationOptionsType;
};

const DEFAULT_LOCAL_STORAGE: ReturnLocalStorageCache = {
  KeyDescription: [],
  CTBElements: [],
  Schedule: 'End on Timer #1',
};

export function getLocalCachedPrefs(
  Group: string,
  Individual: string,
  Evaluation: string,
  Type: 'Rate' | 'Duration' | string
) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), Type].join('_');

  const cached_information = localStorage.getItem(dynamic_key);

  const cached_information_object = cached_information ? JSON.parse(cached_information) : DEFAULT_LOCAL_STORAGE;

  return cached_information_object as ReturnLocalStorageCache;
}

export function setLocalCachedPrefs(
  Group: string,
  Individual: string,
  Evaluation: string,
  Type: 'Rate' | 'Duration' | string,
  Cache: ReturnLocalStorageCache
) {
  const dynamic_key = [Group.trim(), Individual.trim(), Evaluation.trim(), Type].join('_');

  localStorage.setItem(dynamic_key, JSON.stringify(Cache));
}
