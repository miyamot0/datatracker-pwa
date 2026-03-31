import { KeyTiming } from '@/types/timing';
import { SavedSessionResult } from '@/lib/dtos';
import { KeySetInstance } from '@/types/keyset';
import { ModifiedSessionResult } from '@/types/storage';
import { ScoringStrategy } from '@/types/calculation';

type DurationSummationOptions = {
  startsActive?: boolean;
};

/**
 * Helper function to sum active duration from a series of toggle events (e.g., key presses that toggle a state on/off).
 * 
 * @param eventTimesMs - An array of timestamps (in milliseconds) when the toggle events occurred. 
 * @param sessionStartMs - The timestamp (in milliseconds) representing the start of the session. 
 * @param sessionEndMs - The timestamp (in milliseconds) representing the end of the session. 
 * @param options - Optional configuration for how to handle edge cases, such as whether the key starts in an active state at the beginning of the session. 
 * @returns 
 */
function sumDurationFromToggleEvents(
  eventTimesMs: number[],
  sessionStartMs: number,
  sessionEndMs: number,
  options?: DurationSummationOptions,
) {
  const sortedEventTimes = [...eventTimesMs].sort((a, b) => a - b);

  let isActive = options?.startsActive ?? false;
  let cursor = sessionStartMs;
  let totalDurationSeconds = 0;

  for (const eventTime of sortedEventTimes) {
    if (eventTime < sessionStartMs) {
      // Pre-session toggles establish the state at session start.
      isActive = !isActive;
      continue;
    }

    if (eventTime > sessionEndMs) break;

    if (isActive && eventTime > cursor) {
      totalDurationSeconds += (eventTime - cursor) / 1000;
    }

    isActive = !isActive;
    cursor = eventTime;
  }

  if (isActive && sessionEndMs > cursor) {
    totalDurationSeconds += (sessionEndMs - cursor) / 1000;
  }

  return totalDurationSeconds;
}

/**
 * Calculates the total count of key presses for a specific key that occurred during the periods defined by a given schedule key. It iterates through the system key presses to identify the relevant schedule changes and then counts the number of times the specified key was pressed within those periods.
 *
 * @param SessionSettings - The session result object containing the key presses to analyze.
 * @param Schedule - The name of the schedule key that defines the periods to analyze.
 * @param Key - The key set instance representing the specific key to calculate the count for.
 * @returns An object containing the key name, description, schedule, total count of key presses, and the number of bouts (schedule changes).
 */
export function walkSessionFrequencyKey(
  SessionSettings: SavedSessionResult,
  Schedule: KeyTiming,
  Key: KeySetInstance,
  Strategy?: ScoringStrategy,
) {
  const { SystemKeyPresses, FrequencyKeyPresses, DurationKeyPresses } = SessionSettings;

  const relevantScheduleChanges = [];

  if (Strategy?.special && Strategy.schedule === 'system') {
    // Note: Querying the system (timer) events
    relevantScheduleChanges.push(...SystemKeyPresses.filter((k) => k.KeyName === Strategy.specialKeyName));
  } else if (Strategy?.special && Strategy.schedule === 'duration') {
    // Note: Querying the duration-based events
    relevantScheduleChanges.push(...DurationKeyPresses.filter((k) => k.KeyName === Strategy.specialKeyName));
  } else {
    // Normal behavior for timers
    relevantScheduleChanges.push(...SystemKeyPresses.filter((k) => k.KeyName === Schedule));
  }

  const isEven = relevantScheduleChanges.length % 2 === 0;

  let workingCount = 0;

  for (let i = 0; i < relevantScheduleChanges.length - 1; i += 2) {
    const t1 = relevantScheduleChanges[i].TimePressed;
    const t2 = relevantScheduleChanges[i + 1].TimePressed;
    const keysWithinScheduleChange = FrequencyKeyPresses.filter(
      (k) => k.KeyName === Key.KeyName && k.TimePressed > t1 && k.TimePressed <= t2,
    );
    const nEventsLogged = keysWithinScheduleChange.length;

    workingCount += nEventsLogged;
  }

  // TODO: Needs testing
  if (!isEven) {
    const t1 = relevantScheduleChanges.slice(-1)[0].TimePressed;
    const t2 = new Date(SessionSettings.SessionEnd);

    const keysWithinScheduleChange = FrequencyKeyPresses.filter(
      (k) => k.KeyName === Key.KeyName && k.TimePressed > t1 && k.TimePressed < t2,
    );
    const nEventsLogged = keysWithinScheduleChange.length;

    workingCount += nEventsLogged;
  }

  return {
    KeyName: Key.KeyName,
    KeyDescription: Key.KeyDescription,
    Schedule: Schedule,
    Value: workingCount,
    Bouts: -1,
  };
}

/**
 * Alternative duration walker that reconstructs key state at each schedule boundary.
 *
 * This is state-aware and correctly handles cases where a duration key is already
 * active when a schedule period starts.
 *
 * @param SessionSettings - The session result object containing the key presses to analyze.
 * @param Schedule - The name of the schedule key that defines the periods to analyze.
 * @param Key - The key set instance representing the specific key to calculate the duration for.
 * @param Strategy - Optional scoring strategy that may define special keys and schedules.
 * @returns An object containing the key name, description, schedule, total active duration in seconds, and the number of bouts (schedule changes).
 */
export function walkSessionDurationKeyStateAware(
  SessionSettings: SavedSessionResult,
  Schedule: KeyTiming,
  Key: KeySetInstance,
  Strategy?: ScoringStrategy,
) {
  const { SystemKeyPresses, DurationKeyPresses } = SessionSettings;

  const relevantScheduleChanges = [];

  if (Strategy?.special && Strategy.schedule === 'system') {
    relevantScheduleChanges.push(...SystemKeyPresses.filter((k) => k.KeyName === Strategy.specialKeyName));
  } else if (Strategy?.special && Strategy.schedule === 'duration') {
    relevantScheduleChanges.push(...DurationKeyPresses.filter((k) => k.KeyName === Strategy.specialKeyName));
  } else {
    relevantScheduleChanges.push(...SystemKeyPresses.filter((k) => k.KeyName === Schedule));
  }

  const sortedScheduleTimes = relevantScheduleChanges
    .map((k) => new Date(k.TimePressed).getTime())
    .sort((a, b) => a - b);

  const sessionEndMs = new Date(SessionSettings.SessionEnd).getTime();

  // Generate relevant segments of time
  const scheduleIntervals: Array<[number, number]> = [];
  let activeScheduleStart: number | null = null;

  for (const scheduleTime of sortedScheduleTimes) {
    if (activeScheduleStart === null) {
      // Note: This is essentially the start of the measurement interval
      activeScheduleStart = scheduleTime;
    } else {
      if (scheduleTime > activeScheduleStart) {
        scheduleIntervals.push([activeScheduleStart, scheduleTime]);
      }
      activeScheduleStart = null;
    }
  }

  // If schedule is left open, close at session end.
  if (activeScheduleStart !== null && sessionEndMs > activeScheduleStart) {
    scheduleIntervals.push([activeScheduleStart, sessionEndMs]);
  }

  // Get relevant durations and calculate total active time within schedule intervals
  const relevantKeyTimes = DurationKeyPresses.filter((k) => k.KeyName === Key.KeyName)
    .map((k) => new Date(k.TimePressed).getTime())
    .sort((a, b) => a - b);

  const bouts = Math.ceil(relevantKeyTimes.length / 2);

  let workingDurationSeconds = 0;

  for (const [intervalStart, intervalEnd] of scheduleIntervals) {
    workingDurationSeconds += sumDurationFromToggleEvents(relevantKeyTimes, intervalStart, intervalEnd);
  }

  return {
    KeyName: Key.KeyName,
    KeyDescription: Key.KeyDescription,
    Schedule: Schedule,
    Value: workingDurationSeconds,
    Bouts: bouts,
  };
}

/**
 * State-aware alternative for summing special key duration over the session.
 *
 * @param SessionSettings - The session result object containing the key presses to analyze.
 * @param SpecialKeyName - The name of the specific special key to calculate the duration for.
 * @param options - Optional configuration for how to handle edge cases (e.g., starts active).
 * @returns The total active duration in seconds for the specified special key.
 */
export function sumDurationSpecialKeyStateAware(
  SessionSettings: SavedSessionResult,
  SpecialKeyName: string,
  options?: DurationSummationOptions,
) {
  const eventTimesMs = SessionSettings.SystemKeyPresses.filter((k) => k.KeyName === SpecialKeyName).map((k) =>
    new Date(k.TimePressed).getTime(),
  );

  const sessionStartMs = new Date(SessionSettings.SessionStart).getTime();
  const sessionEndMs = new Date(SessionSettings.SessionEnd).getTime();

  return sumDurationFromToggleEvents(eventTimesMs, sessionStartMs, sessionEndMs, options);
}

/**
 * State-aware alternative for summing duration-based scoring key duration over the session.
 *
 * @param SessionSettings - The session result object containing the key presses to analyze.
 * @param SpecialKeyName - The name of the specific special key to calculate the duration for.
 * @param options - Optional configuration for duration summation, such as whether the key starts active.
 * @returns The total active duration in seconds for the specified special key within the defined schedule periods.
 */
export function sumDurationScoringKeyStateAware(
  SessionSettings: SavedSessionResult,
  SpecialKeyName: string,
  options?: DurationSummationOptions,
) {
  const eventTimesMs = SessionSettings.DurationKeyPresses.filter((k) => k.KeyName === SpecialKeyName).map((k) =>
    new Date(k.TimePressed).getTime(),
  );

  const sessionStartMs = new Date(SessionSettings.SessionStart).getTime();
  const sessionEndMs = new Date(SessionSettings.SessionEnd).getTime();

  return sumDurationFromToggleEvents(eventTimesMs, sessionStartMs, sessionEndMs, options);
}

/**
 * Combines and sorts all key presses (Frequency, Duration, System) for a session by their TimeIntoSession property.
 *
 * @param relevantSession The session result object containing the key presses to combine and sort.
 * @returns An array of key presses sorted by TimeIntoSession, which can be used for plotting session outcomes in chronological order.
 */
export function combineAndSortKeyPresses(relevantSession: ModifiedSessionResult) {
  return [
    ...relevantSession.FrequencyKeyPresses,
    ...relevantSession.DurationKeyPresses,
    ...relevantSession.SystemKeyPresses,
  ].sort((a, b) => a.TimeIntoSession - b.TimeIntoSession);
}
