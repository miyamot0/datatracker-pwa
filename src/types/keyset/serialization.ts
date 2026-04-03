import { LogicState } from '@/lib/logic';
import { KeySetInstance } from './core';

/**
 * Type for extending keyset
 */
export type KeySetLogical = KeySetInstance & { Value: number; Tag: string };

/**
 * Keyset type more amenable to serialization
 */
export type KeySetSerialize = {
  id: string;
  Name: string;
  FrequencyKeys: KeySetInstance[];
  DurationKeys: KeySetInstance[];
  createdAt: string;
  lastModified: string;

  // Note: Special keys
  DerivedKeys: LogicState[];
  SpecialDurationKeys: KeySetInstance[];
  ScorableDurationKeys: KeySetInstance[];
};
