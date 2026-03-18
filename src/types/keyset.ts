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
};

/**
 * Type for extending keyset
 */
export type KeySetExtended = KeySet & { Group: string; Individual: string };

/**
 * Type for extending keyset with visibility and type information
 */
export type EnhancedKeySetInstance = KeySetInstance & { Visible: boolean; Type: 'Key' | 'Summary' };

/**
 * Type for extending keyset
 */
export type KeySetLogical = KeySetInstance & { Value: number };

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
};

export type ExpandedKeySetInstance = {
  KeyDescription: string;
  Visible: boolean;
};
