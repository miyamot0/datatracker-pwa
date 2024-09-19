import { SavedSessionResult } from '@/lib/dtos';
import { KeySetInstance } from '@/types/keyset';
import { KeyTiming } from '../../session-recorder/types/session-recorder-types';

export function walkSessionFrequencyKey(SessionSettings: SavedSessionResult, Schedule: KeyTiming, Key: KeySetInstance) {
  const { SystemKeyPresses, FrequencyKeyPresses } = SessionSettings;

  const relevant_schedule_changes = SystemKeyPresses.filter((k) => k.KeyName === Schedule);

  const is_even = relevant_schedule_changes.length % 2 === 0;

  if (!is_even) throw new Error('Schedule changes must be even');

  let working_count = 0;

  for (let i = 0; i < relevant_schedule_changes.length - 1; i += 2) {
    const t1 = relevant_schedule_changes[i].TimePressed;
    const t2 = relevant_schedule_changes[i + 1].TimePressed;

    const keys_within_sched_change = FrequencyKeyPresses.filter(
      (k) => k.KeyName === Key.KeyName && k.TimePressed > t1 && k.TimePressed <= t2
    );

    const n_events_logged = keys_within_sched_change.length;

    working_count += n_events_logged;
  }

  return {
    KeyName: Key.KeyName,
    KeyDescription: Key.KeyDescription,
    Schedule: Schedule,
    Value: working_count,
  };
}

export function walkSessionDurationKey(SessionSettings: SavedSessionResult, Schedule: KeyTiming, Key: KeySetInstance) {
  const { SystemKeyPresses, DurationKeyPresses } = SessionSettings;

  const relevant_schedule_changes = SystemKeyPresses.filter((k) => k.KeyName === Schedule);

  const is_even = relevant_schedule_changes.length % 2 === 0;

  if (!is_even) throw new Error('Schedule changes must be even');

  let working_duration = 0;

  for (let i = 0; i < relevant_schedule_changes.length - 1; i += 2) {
    const t1 = relevant_schedule_changes[i].TimePressed;
    const t2 = relevant_schedule_changes[i + 1].TimePressed;

    const keys_within_sched_change = DurationKeyPresses.filter(
      (k) => k.KeyName === Key.KeyName && k.TimePressed > t1 && k.TimePressed <= t2
    );

    const n_events_logged = keys_within_sched_change.length;

    if (n_events_logged === 0) {
      working_duration += 0;
    } else if (n_events_logged === 1) {
      working_duration += (new Date(t2).getTime() - new Date(keys_within_sched_change[0].TimePressed).getTime()) / 1000;
    } else if (n_events_logged === 2) {
      working_duration +=
        (new Date(keys_within_sched_change[1].TimePressed).getTime() -
          new Date(keys_within_sched_change[0].TimePressed).getTime()) /
        1000;
    } else {
      //let increment = 0;
      const offset = n_events_logged % 2 === 0 ? 0 : -1;

      for (let k = 0; k < n_events_logged + offset; k += 2) {
        const t1 = new Date(keys_within_sched_change[k].TimePressed);
        const t2 = new Date(keys_within_sched_change[k + 1].TimePressed);

        working_duration += (t2.getTime() - t1.getTime()) / 1000;
      }

      if (offset === -1) {
        const last_key = keys_within_sched_change.slice(-1)[0];

        working_duration += (new Date(t2).getTime() - new Date(last_key.TimePressed).getTime()) / 1000;
      }
    }
  }

  return {
    KeyName: Key.KeyName,
    KeyDescription: Key.KeyDescription,
    Schedule: Schedule,
    Value: working_duration,
  };
}
