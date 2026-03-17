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
 * Pulls the relevant session numbers from a set of paired sessions for reliability calculations.
 *
 * @param pairedSessions An array of paired sessions used for reliability calculations
 * @returns An array of unique session numbers that are present in the paired sessions, sorted in ascending order
 */
export function pullRelevantSessions(pairedSessions: ReliabilityPairType[]) {
  return [
    ...new Set(
      pairedSessions.map((pair) => Number(pair.primary?.SessionSettings?.Session)).filter((n) => !Number.isNaN(n)),
    ),
  ].sort((a, b) => a - b);
}
