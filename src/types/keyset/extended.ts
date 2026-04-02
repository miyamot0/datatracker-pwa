import { KeySet, KeySetInstance } from './core';

/**
 * Type for extending keyset
 */
export type KeySetExtended = KeySet & { Group: string; Individual: string };

/**
 * Type for extending keyset with visibility and type information
 */
export type EnhancedKeySetInstance = KeySetInstance & { Visible: boolean; Type: 'Key' | 'Summary' };
