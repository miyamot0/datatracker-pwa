import { KeySet, KeySetSerialize } from '@/types/keyset';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new key set
 *
 * @param Name The name of the key set
 * @returns
 */
export function createNewKeySet(Name: string): KeySet {
  return {
    Name,
    FrequencyKeys: [],
    DurationKeys: [],
    id: uuidv4(),
    createdAt: new Date(),
    lastModified: new Date(),
  };
}

/**
 * Serialize a KeySet
 *
 * @param keyset The key set to serialize
 * @returns
 */
export function serializeKeySet(keyset: KeySet): string {
  const keyset_serialized: KeySetSerialize = {
    id: keyset.id,
    Name: keyset.Name,
    FrequencyKeys: keyset.FrequencyKeys,
    DurationKeys: keyset.DurationKeys,
    createdAt: keyset.createdAt.toJSON(),
    lastModified: keyset.lastModified.toJSON(),
  };

  return JSON.stringify(keyset_serialized);
}

/**
 * Deserialize a KeySet
 *
 * @param json The serialized key set
 * @returns
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
  };
}
