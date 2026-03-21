import { KeySet, KeySetSerialize } from '@/types/keyset';
import { v4 as uuidv4 } from 'uuid';
import { SavedSessionResult } from './dtos';
import { ModifiedSessionResult } from '@/types/storage';

/**
 * Create a new key set
 *
 * @param Name The name of the key set
 * @returns a new key set object with the provided name and default values for other properties
 */
export function createNewKeySet(Name: string): KeySet {
  return {
    Name,
    FrequencyKeys: [],
    DurationKeys: [],
    id: uuidv4(),
    createdAt: new Date(),
    lastModified: new Date(),
    DerivedKeys: [],
  };
}

/**
 * Serialize a KeySet
 *
 * @param keyset The key set to serialize
 * @returns the serialized key set as a JSON string
 */
export function serializeKeySet(keyset: KeySet): string {
  const keyset_serialized: KeySetSerialize = {
    id: keyset.id,
    Name: keyset.Name,
    FrequencyKeys: keyset.FrequencyKeys,
    DurationKeys: keyset.DurationKeys,
    createdAt: keyset.createdAt.toJSON(),
    lastModified: keyset.lastModified.toJSON(),
    DerivedKeys: keyset.DerivedKeys || [],
  };

  return JSON.stringify(keyset_serialized);
}

/**
 * Deserialize a KeySet
 *
 * @param json The serialized key set
 * @returns deserialized key set object
 */
export function deserializeKeySet(json: string): KeySet {
  const keyset_json = JSON.parse(json) as KeySetSerialize;

  return {
    id: keyset_json.id,
    Name: keyset_json.Name,
    FrequencyKeys: keyset_json.FrequencyKeys,
    DurationKeys: keyset_json.DurationKeys,
    createdAt: new Date(keyset_json.createdAt),
    lastModified: new Date(keyset_json.lastModified),
    DerivedKeys: keyset_json.DerivedKeys || [],
  };
}

/**
 * Pull the most recent session result from an array of session results
 *
 * @param data - An array of session results, which can be either SavedSessionResult or ModifiedSessionResult, both containing a SessionSettings property with a Session number used to determine recency
 * @returns The most recent session result, determined by the highest SessionSettings.Session value in the input array
 */
export function pullMostRecentSession(
  data: SavedSessionResult[] | ModifiedSessionResult[],
): SavedSessionResult | ModifiedSessionResult {
  const latest = data.sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session).slice(-1)[0];
  return latest;
}

/**
 * Pull the most recent key set from an array of session results
 *
 * @param data - An array of session results, which can be either SavedSessionResult or ModifiedSessionResult, both containing a Keyset property
 * @returns The KeySet object from the most recent session result, determined by the highest SessionSettings.Session value in the input array
 */
export function pullMostRecentKeySet(data: SavedSessionResult[] | ModifiedSessionResult[]): KeySet {
  const latest = pullMostRecentSession(data);
  return latest.Keyset;
}
