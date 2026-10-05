import { SavedSessionResult } from '@/lib/dtos/session-results';

/** Maps an original Therapist/Initials value to its `Person 00X` pseudonym */
export type PseudonymMap = Map<string, string>;

const PERSON_PREFIX = 'Person ';
const PERSON_INDEX_MIN_DIGITS = 3;

/**
 * Build one shared roster of Therapist/Initials values, sorted alphabetically and numbered
 *
 * @param results the batch of `SavedSessionResult` files to pool `Therapist`/`Initials` values from
 * @returns a `PseudonymMap` from each unique, non-blank `Therapist`/`Initials` value to a `Person 00X` pseudonym
 */
export function buildPersonRoster(results: SavedSessionResult[]): PseudonymMap {
  const uniqueValues = new Set<string>();

  for (const result of results) {
    const { Therapist, Initials } = result.SessionSettings;
    if (Therapist) uniqueValues.add(Therapist);
    if (Initials) uniqueValues.add(Initials);
  }

  const sortedValues = [...uniqueValues].sort((a, b) => a.localeCompare(b));

  const roster: PseudonymMap = new Map();
  sortedValues.forEach((value, index) => {
    const paddedIndex = String(index + 1).padStart(PERSON_INDEX_MIN_DIGITS, '0');
    roster.set(value, `${PERSON_PREFIX}${paddedIndex}`);
  });

  return roster;
}

/**
 * Resolve a Therapist/Initials value to its roster pseudonym, passing blanks through unchanged
 *
 * @param value the original `Therapist` or `Initials` value to resolve
 * @param roster the shared person roster, as returned by `buildPersonRoster`
 * @returns the `Person 00X` pseudonym for `value`, or `value` itself if it is blank or not in `roster`
 */
export function resolvePersonPseudonym(value: string, roster: PseudonymMap): string {
  if (!value) return value;
  return roster.get(value) ?? value;
}
