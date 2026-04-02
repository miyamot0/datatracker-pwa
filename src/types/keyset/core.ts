import { LogicState } from '@/lib/logic';

/**
 * Type for holding the key values
 */
export type KeySetInstance = {
  KeyName: string;
  KeyDescription: string;
  KeyCode: number;
};

/**
 * Type for holding the *set* of keys
 */
export type KeySet = {
  id: string;
  Name: string;
  FrequencyKeys: KeySetInstance[];
  DurationKeys: KeySetInstance[];
  createdAt: Date;
  lastModified: Date;

  // Note: These are derived on-the-fly based on logic states
  DerivedKeys: LogicState[];
  SpecialDurationKeys: KeySetInstance[];
  ScorableDurationKeys: KeySetInstance[];
};
