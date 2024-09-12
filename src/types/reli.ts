import { SavedSessionResult } from "@/lib/dtos";

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
