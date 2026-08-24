import { SavedSessionResult } from '@/lib/dtos/session-results';
import { KeyManageType } from '@/types/timing';

/**
 * Normalize a Date-like value that may still be a raw ISO string post-JSON.parse
 *
 * @param value the value to normalize, either a `Date` instance or an ISO 8601 date string
 * @returns a `Date` instance representing `value`
 */
export function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Shift a Date-like value by an offset, preserving whether it was a Date or an ISO string
 *
 * @param value the `Date` or ISO 8601 date string to shift
 * @param offsetMs the number of milliseconds to add to `value` (may be negative)
 * @returns the shifted value, in the same representation (`Date` or string) as `value`
 */
export function shiftDateLike<T extends Date | string>(value: T, offsetMs: number): T {
  const shifted = new Date(toDate(value).getTime() + offsetMs);
  return (typeof value === 'string' ? shifted.toISOString() : shifted) as T;
}

/**
 * Collect every `TimePressed` timestamp recorded across all key-press arrays of a session
 *
 * @param result the `SavedSessionResult` to collect key-press timestamps from
 * @returns a `Date` for every key press in `result`, in `SystemKeyPresses`/`FrequencyKeyPresses`/`DurationKeyPresses` order
 */
function collectKeyPressTimestamps(result: SavedSessionResult): Date[] {
  return [...result.SystemKeyPresses, ...result.FrequencyKeyPresses, ...result.DurationKeyPresses].map((keyPress) =>
    toDate(keyPress.TimePressed),
  );
}

/**
 * Find the earliest instant across every date-bearing field in the whole batch
 *
 * @param results the batch of `SavedSessionResult` files to scan (must be non-empty)
 * @returns the earliest `Date` found across `SessionStart`, `Keyset.createdAt`/`lastModified`, and all key-press timestamps in `results` (`SessionEnd` is not scanned)
 */
export function findEarliestTimestamp(results: SavedSessionResult[]): Date {
  if (results.length === 0) {
    throw new Error('Cannot find earliest timestamp: no results supplied');
  }

  const timestamps = results.flatMap((result) => [
    toDate(result.SessionStart),
    toDate(result.Keyset.createdAt),
    toDate(result.Keyset.lastModified),
    ...collectKeyPressTimestamps(result),
  ]);

  const validTimestamps = timestamps.filter((date) => !isNaN(date.getTime()));

  if (validTimestamps.length === 0) {
    throw new Error('Cannot find earliest timestamp: no valid dates found in results');
  }

  return new Date(Math.min(...validTimestamps.map((date) => date.getTime())));
}

/**
 * Offset (ms) needed to move the earliest timestamp in the batch onto the anchor date
 *
 * @param earliest the earliest timestamp found across the batch, as returned by `findEarliestTimestamp`
 * @param anchorDate the date the earliest timestamp should be shifted onto
 * @returns the number of milliseconds to add to every timestamp in the batch
 */
export function computeOffsetMs(earliest: Date, anchorDate: Date): number {
  return anchorDate.getTime() - earliest.getTime();
}

/**
 * Shift the `TimePressed` timestamp of every key press by the same offset
 *
 * @param keyPresses the key presses to shift
 * @param offsetMs the number of milliseconds to add to each `TimePressed` value
 * @returns a new array of key presses with `TimePressed` shifted, preserving all other fields
 */
export function shiftKeyPresses(keyPresses: KeyManageType[], offsetMs: number): KeyManageType[] {
  return keyPresses.map((keyPress) => ({
    ...keyPress,
    TimePressed: shiftDateLike(keyPress.TimePressed, offsetMs),
  }));
}
