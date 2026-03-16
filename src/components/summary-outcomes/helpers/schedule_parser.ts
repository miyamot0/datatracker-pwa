import { KeyTiming } from '@/components/session-recorder/types/session-recorder-types';
import { SavedSessionResult } from '@/lib/dtos';
import { KeySetInstance } from '@/types/keyset';

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
