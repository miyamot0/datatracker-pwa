import { KeyTiming } from '@/types/timing';
import { SavedSessionResult } from '@/lib/dtos';
import { KeySetInstance } from '@/types/keyset';
import { ModifiedSessionResult } from '@/types/storage';

/**
 * Calculates the total count of key presses for a specific key that occurred during the periods defined by a given schedule key. It iterates through the system key presses to identify the relevant schedule changes and then counts the number of times the specified key was pressed within those periods.
 *
 * @param SessionSettings - The session result object containing the key presses to analyze.
 * @param Schedule - The name of the schedule key that defines the periods to analyze.
 * @param Key - The key set instance representing the specific key to calculate the count for.
 * @returns An object containing the key name, description, schedule, total count of key presses, and the number of bouts (schedule changes).
 */
export function walkSessionFrequencyKey(SessionSettings: SavedSessionResult, Schedule: KeyTiming, Key: KeySetInstance) {
  const { SystemKeyPresses, FrequencyKeyPresses } = SessionSettings;

  const relevantScheduleChanges = SystemKeyPresses.filter((k) => k.KeyName === Schedule);
  const isEven = relevantScheduleChanges.length % 2 === 0;

  if (!isEven) throw new Error('Schedule changes must be even');

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
 */
export function walkSessionDurationKey(SessionSettings: SavedSessionResult, Schedule: KeyTiming, Key: KeySetInstance) {
  const { SystemKeyPresses, DurationKeyPresses } = SessionSettings;
  const relevantScheduleChanges = SystemKeyPresses.filter((k) => k.KeyName === Schedule);
  const isEven = relevantScheduleChanges.length % 2 === 0;
  const bouts = relevantScheduleChanges.length / 2;

  if (!isEven) throw new Error('Schedule changes must be even');

  let workingDuration = 0;

  for (let i = 0; i < relevantScheduleChanges.length - 1; i += 2) {
    const t1 = relevantScheduleChanges[i].TimePressed;
    const t2 = relevantScheduleChanges[i + 1].TimePressed;
    const keysWithinScheduleChange = DurationKeyPresses.filter(
      (k) => k.KeyName === Key.KeyName && k.TimePressed > t1 && k.TimePressed <= t2,
    );
    const nEventsLogged = keysWithinScheduleChange.length;

    if (nEventsLogged === 0) {
      workingDuration += 0;
    } else if (nEventsLogged === 1) {
      workingDuration += (new Date(t2).getTime() - new Date(keysWithinScheduleChange[0].TimePressed).getTime()) / 1000;
    } else if (nEventsLogged === 2) {
      workingDuration +=
        (new Date(keysWithinScheduleChange[1].TimePressed).getTime() -
          new Date(keysWithinScheduleChange[0].TimePressed).getTime()) /
        1000;
    } else {
      //let increment = 0;
      const offset = nEventsLogged % 2 === 0 ? 0 : -1;

      for (let k = 0; k < nEventsLogged + offset; k += 2) {
        const t1 = new Date(keysWithinScheduleChange[k].TimePressed);
        const t2 = new Date(keysWithinScheduleChange[k + 1].TimePressed);

        workingDuration += (t2.getTime() - t1.getTime()) / 1000;
      }

      if (offset === -1) {
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
