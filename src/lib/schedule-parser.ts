import { KeyTiming } from '@/types/timing';
import { SavedSessionResult } from '@/lib/dtos';
import { KeySetInstance } from '@/types/keyset';
import { ModifiedSessionResult } from '@/types/storage';
import { ScoringStrategy } from '@/types/calculation';

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
 * Calculates the total duration of time that a specific key was active during the periods defined by a given schedule key. It iterates through the system key presses to identify the relevant schedule changes and then sums up the durations of the specified key within those periods, accounting for multiple presses and releases.
 *
 * @param SessionSettings - The session result object containing the key presses to analyze.
 * @param Schedule - The name of the schedule key that defines the periods to analyze.
 * @param Key - The key set instance representing the specific key to calculate the duration for.
 * @returns An object containing the key name, description, schedule, total active duration in seconds, and the number of bouts (schedule changes).
 * @deprecated
 */
export function walkSessionDurationKey(
  SessionSettings: SavedSessionResult,
  Schedule: KeyTiming,
  Key: KeySetInstance,
  Strategy?: ScoringStrategy,
) {
  const { SystemKeyPresses, DurationKeyPresses } = SessionSettings;

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

  //const isEven = relevantScheduleChanges.length % 2 === 0;

  const relevantKeyEvents = DurationKeyPresses.filter((k) => k.KeyName === Key.KeyName);
  const bouts = Math.ceil(relevantKeyEvents.length / 2);

  //if (!isEven) throw new Error('Schedule changes must be even');

  let workingDuration = 0;

  for (let i = 0; i < relevantScheduleChanges.length - 1; i += 2) {
    const t1 = relevantScheduleChanges[i].TimePressed;
    const t2 = relevantScheduleChanges[i + 1].TimePressed;
    const keysWithinScheduleChange = relevantKeyEvents.filter((k) => k.TimePressed > t1 && k.TimePressed <= t2);
    const nEventsLogged = keysWithinScheduleChange.length;

    if (nEventsLogged === 0) {
      // No events contained
      workingDuration += 0;
    } else if (nEventsLogged === 1) {
      // Just one event is contained - we assume it starts at the press and ends at the end of the schedule change
      workingDuration += (new Date(t2).getTime() - new Date(keysWithinScheduleChange[0].TimePressed).getTime()) / 1000;
    } else if (nEventsLogged === 2) {
      // Note: Two events are contained - we assume the first is a press and the second is a release, so we take the difference between them as the duration within this schedule change
      workingDuration +=
        (new Date(keysWithinScheduleChange[1].TimePressed).getTime() -
          new Date(keysWithinScheduleChange[0].TimePressed).getTime()) /
        1000;
    } else {
      // Note: More than two events are contained - we assume they are alternating presses and releases, so we sum up the durations between each pair of events. We also account for the possibility of an odd number of events, which would indicate a press without a corresponding release by using the schedule change end time as the end point for the final duration calculation.

      const offset = nEventsLogged % 2 === 0 ? 0 : -1;

      for (let k = 0; k < nEventsLogged + offset; k += 2) {
        const t1 = new Date(keysWithinScheduleChange[k].TimePressed);
        const t2 = new Date(keysWithinScheduleChange[k + 1].TimePressed);

        workingDuration += (t2.getTime() - t1.getTime()) / 1000;
      }

      if (offset === -1) {
        // Note: Cap to close of current interval
        const last_key = keysWithinScheduleChange.slice(-1)[0];

        workingDuration += (new Date(t2).getTime() - new Date(last_key.TimePressed).getTime()) / 1000;
      }
    }
  }

  return {
    KeyName: Key.KeyName,
    KeyDescription: Key.KeyDescription,
    Schedule: Schedule,
    Value: workingDuration,
    Bouts: bouts,
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
    let isActive = false;

    // Events at the exact start boundary establish the key state inside the interval.
    for (const eventTime of relevantKeyTimes) {
      if (eventTime <= intervalStart) {
        // If a time noticed before the interval, we use it to set the initial state of the key for this interval
        isActive = !isActive;
        continue;
      }
      break;
    }

    let cursor = intervalStart;

    // "Credit" for active state prior to a press starting in the interval
    for (const eventTime of relevantKeyTimes) {
      if (eventTime <= intervalStart) continue;
      if (eventTime >= intervalEnd) break;

      if (isActive) {
        workingDurationSeconds += (eventTime - cursor) / 1000;
      }

      isActive = !isActive;
      cursor = eventTime;
    }

    // If active and interval ends, credit until the end of the interval
    if (isActive && intervalEnd > cursor) {
      workingDurationSeconds += (intervalEnd - cursor) / 1000;
    }
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
 * Calculates the total duration of time that a specific special key was active during a session. It identifies all the system key presses corresponding to the special key and sums up the durations between each pair of presses, assuming that each press represents a toggle (e.g., on/off) of the key's state. The function also checks to ensure that there is an even number of presses, as each activation should have a corresponding deactivation.
 *
 * @param SessionSettings - The session result object containing the key presses to analyze.
 * @param SpecialKeyName - The name of the specific special key to calculate the duration for.
 * @returns The total active duration in seconds for the specified special key.
 */
export function sumDurationSpecialKey(SessionSettings: SavedSessionResult, SpecialKeyName: string) {
  const { SystemKeyPresses } = SessionSettings;

  const relevantScheduleChanges = SystemKeyPresses.filter((k) => k.KeyName === SpecialKeyName);

  const isEven = relevantScheduleChanges.length % 2 === 0;

  let workingDuration = 0;

  for (let i = 0; i < relevantScheduleChanges.length - 1; i += 2) {
    const t1 = relevantScheduleChanges[i].TimePressed;
    const t2 = relevantScheduleChanges[i + 1].TimePressed;

    workingDuration += (new Date(t2).getTime() - new Date(t1).getTime()) / 1000;
  }

  // TODO: Needs testing
  if (!isEven) {
    const lastRelevantPressEvent = relevantScheduleChanges.slice(-1)[0].TimePressed;
    const sessionEndTime = new Date(SessionSettings.SessionEnd).getTime();

    workingDuration += (sessionEndTime - new Date(lastRelevantPressEvent).getTime()) / 1000;
  }

  return workingDuration;
}

/**
 * Calculates the total duration of time that a specific special key was active during the periods defined by a given schedule key. It identifies all the system key presses corresponding to the special key and sums up the durations between each pair of presses that occur within the schedule periods, assuming that each press represents a toggle (e.g., on/off) of the key's state. The function also checks to ensure that there is an even number of presses, as each activation should have a corresponding deactivation.
 *
 * @param SessionSettings - The session result object containing the key presses to analyze.
 * @param Schedule - The name of the schedule key that defines the periods to analyze.
 * @param SpecialKeyName - The name of the specific special key to calculate the duration for.
 * @returns The total active duration in seconds for the specified special key within the defined schedule periods.
 */
export function sumDurationScoringKey(SessionSettings: SavedSessionResult, SpecialKeyName: string) {
  const { DurationKeyPresses } = SessionSettings;

  const relevantScheduleChanges = DurationKeyPresses.filter((k) => k.KeyName === SpecialKeyName);

  const isEven = relevantScheduleChanges.length % 2 === 0;

  let workingDuration = 0;

  for (let i = 0; i < relevantScheduleChanges.length - 1; i += 2) {
    const t1 = relevantScheduleChanges[i].TimePressed;
    const t2 = relevantScheduleChanges[i + 1].TimePressed;

    workingDuration += (new Date(t2).getTime() - new Date(t1).getTime()) / 1000;
  }

  // TODO: Needs testing
  if (!isEven) {
    const lastRelevantPressEvent = relevantScheduleChanges.slice(-1)[0].TimePressed;
    const sessionEndTime = new Date(SessionSettings.SessionEnd).getTime();

    workingDuration += (sessionEndTime - new Date(lastRelevantPressEvent).getTime()) / 1000;
  }

  return workingDuration;
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
