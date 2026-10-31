import { KeySet } from '@/types/keyset/core';
import { KeySetSerialize } from '@/types/keyset/serialization';
import { v4 } from '@/lib/uuid';
import '@/lib/zod-config';
import { z } from 'zod';
import { SavedSessionResult } from './dtos/session-results';
import { ModifiedSessionResult } from '@/types/storage';
import { KeySetInstanceSchema, LogicStateSchema, parseKeepingUnmatchedList, parseLenientList } from '@/lib/lenient-schemas';

// Only id and Name are required. Other fields are optional, and bad entries are dropped by parseLenientList.
const KeySetFileSchema = z.looseObject({
  id: z.string(),
  Name: z.string(),
  FrequencyKeys: z.unknown().optional(),
  DurationKeys: z.unknown().optional(),
  createdAt: z.string().optional(),
  lastModified: z.string().optional(),
  DerivedKeys: z.unknown().optional(),
  SpecialDurationKeys: z.unknown().optional(),
  ScorableDurationKeys: z.unknown().optional(),
});

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
    id: v4(),
    createdAt: new Date(),
    lastModified: new Date(),
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
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
    SpecialDurationKeys: keyset.SpecialDurationKeys || [],
    ScorableDurationKeys: keyset.ScorableDurationKeys || [],
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
  const keyset_json = KeySetFileSchema.parse(JSON.parse(json));

  return {
    id: keyset_json.id,
    Name: keyset_json.Name,
    FrequencyKeys: parseLenientList(keyset_json.FrequencyKeys, KeySetInstanceSchema),
    DurationKeys: parseLenientList(keyset_json.DurationKeys, KeySetInstanceSchema),
    createdAt: new Date(keyset_json.createdAt ?? ''),
    lastModified: new Date(keyset_json.lastModified ?? ''),
    DerivedKeys: parseKeepingUnmatchedList(keyset_json.DerivedKeys, LogicStateSchema),
    SpecialDurationKeys: parseLenientList(keyset_json.SpecialDurationKeys, KeySetInstanceSchema),
    ScorableDurationKeys: parseLenientList(keyset_json.ScorableDurationKeys, KeySetInstanceSchema),
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
