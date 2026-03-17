import { SavedSessionResult } from '@/lib/dtos';

/**
 * A key that has been selected for reliability metrics.
 */
export type ProbedKey = { KeyName: string; KeyDescription: string };

/**
 * Probed key w/ IOA calculations
 */
export type ScoredKey = ProbedKey & {
  Session: number;
  EIA: number;
  PIA: number;
  TIA: number;
  OIA: number;
  NIA: number;
  PMA: number;
};

/**
 * This is a bin/value pairing for a specific key
 */
export type BinValueType = {
  BinNumber: number;
  Value: number;
};

/**
 * Results holder for preparing for reliability calculations
 */
export type ReliabilityPairType = {
  primary: SavedSessionResult;
  reli: SavedSessionResult;
};

/**
 * A key/value pairing for reliability metrics, used for preparing data for display in the reliability viewer
 */
export type KeyedReli = {
  KeyName: string;
  Value: number;
};

/**
 * This is the type definition for the PreparedReliabilityData type, which is the format of the data used to display reliability metrics in the reliability viewer
 */
export type PreparedReliabilityData = {
  headings: string[];
  rows: Array<Array<{ value: string; readOnly: boolean }>>;
};
