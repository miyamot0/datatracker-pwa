import { SavedSessionResult } from '../dtos';

/**
 * Filters session results to only include primary role sessions, sorted by session number
 */
export function filterSessionsByPrimaryRole(results: SavedSessionResult[]) {
  return results
    .filter((result) => result?.SessionSettings?.Role === 'Primary')
    .sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session);
}

/**
 * Filters session results to only include reliability role sessions, sorted by session number
 */
export function filterSessionsByReliabilityRole(results: SavedSessionResult[]) {
  return results
    .filter((result) => result?.SessionSettings?.Role === 'Reliability')
    .sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session);
}

/**
 * Extracts unique session conditions from the results
 */
export function getUniqueSessionConditions(results: SavedSessionResult[]) {
  return Array.from(
    new Set(
      results
        .filter((result) => result?.SessionSettings?.Condition != null)
        .map((result) => result.SessionSettings.Condition),
    ),
  );
}
