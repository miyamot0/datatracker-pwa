import { SavedSessionResult } from '@/lib/dtos/session-results';
import { PseudonymMap, buildPersonRoster, resolvePersonPseudonym } from './name-shifting';
import { computeOffsetMs, findEarliestTimestamp, shiftDateLike, shiftKeyPresses } from './date-shifting';

/**
 * Options controlling optional behaviors when anonymizing a SavedSessionResult
 */
export type AnonymizeOptions = {
  redactComments?: boolean;
};

/**
 * Shared state built once per batch so every file gets the same time offset and pseudonyms
 */
export type AnonymizationContext = {
  offsetMs: number;
  anchorDate: Date;
  earliestTimestamp: Date;
  personRoster: PseudonymMap;
};

/**
 * Build the shared context (time offset + pseudonym rosters) for anonymizing an entire batch
 *
 * @param results the batch of `SavedSessionResult` files to anonymize together
 * @param anchorDate the date the earliest timestamp across `results` should be shifted onto
 * @returns an `AnonymizationContext` to pass to `anonymizeSessionResult` for every file in `results`
 */
export function createAnonymizationContext(results: SavedSessionResult[], anchorDate: Date): AnonymizationContext {
  const earliestTimestamp = findEarliestTimestamp(results);
  const offsetMs = computeOffsetMs(earliestTimestamp, anchorDate);
  const personRoster = buildPersonRoster(results);

  return {
    offsetMs,
    anchorDate,
    earliestTimestamp,
    personRoster,
  };
}

/**
 * Return a de-identified copy of a single SavedSessionResult using a shared batch context
 *
 * @param result the `SavedSessionResult` to anonymize
 * @param context the shared batch context, as returned by `createAnonymizationContext`
 * @param options optional behaviors; `redactComments` defaults to `true`
 * @returns a new `SavedSessionResult` with dates shifted and PII pseudonymized/redacted; `result` is not mutated
 */
export function anonymizeSessionResult(
  result: SavedSessionResult,
  context: AnonymizationContext,
  options?: AnonymizeOptions,
): SavedSessionResult {
  const redactComments = options?.redactComments ?? true;

  return {
    ...result,
    Keyset: {
      ...result.Keyset,
      createdAt: shiftDateLike(result.Keyset.createdAt, context.offsetMs),
      lastModified: shiftDateLike(result.Keyset.lastModified, context.offsetMs),
    },
    SessionSettings: {
      ...result.SessionSettings,
      Therapist: resolvePersonPseudonym(result.SessionSettings.Therapist, context.personRoster),
      Initials: resolvePersonPseudonym(result.SessionSettings.Initials, context.personRoster),
    },
    SystemKeyPresses: shiftKeyPresses(result.SystemKeyPresses, context.offsetMs),
    FrequencyKeyPresses: shiftKeyPresses(result.FrequencyKeyPresses, context.offsetMs),
    DurationKeyPresses: shiftKeyPresses(result.DurationKeyPresses, context.offsetMs),
    SessionStart: shiftDateLike(result.SessionStart, context.offsetMs),
    SessionEnd: shiftDateLike(result.SessionEnd, context.offsetMs),
    Comments: redactComments ? undefined : result.Comments,
  };
}

/**
 * De-identify a whole batch of SavedSessionResult files with one shared time offset and roster
 *
 * @param results the batch of `SavedSessionResult` files to anonymize together
 * @param anchorDate the date the earliest timestamp across `results` should be shifted onto
 * @param options optional behaviors applied to every file; `redactComments` defaults to `true`
 * @returns a new array of de-identified `SavedSessionResult`s, in the same order as `results`
 */
export function anonymizeSessionResults(
  results: SavedSessionResult[],
  anchorDate: Date,
  options?: AnonymizeOptions,
): SavedSessionResult[] {
  const context = createAnonymizationContext(results, anchorDate);
  return results.map((result) => anonymizeSessionResult(result, context, options));
}
