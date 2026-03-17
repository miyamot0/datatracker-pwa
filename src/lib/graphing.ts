import { SessionTerminationOptionsType } from '@/types/terminations';
import { SavedSessionResult } from './dtos';
import { walkSessionDurationKey, walkSessionFrequencyKey } from '@/components/summary-outcomes/helpers/schedule_parser';

export function filterSessionsByPrimaryRole(results: SavedSessionResult[]) {
  return results
    .filter((result) => result.SessionSettings.Role === 'Primary')
    .sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session);
}

export function filterSessionsByReliabilityRole(results: SavedSessionResult[]) {
  return results
    .filter((result) => result.SessionSettings.Role === 'Reliability')
    .sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session);
}

export function getUniqueSessionConditions(results: SavedSessionResult[]) {
  return Array.from(new Set(results.map((result) => result.SessionSettings.Condition)));
}

export function generateTicks(maxTick: number, minTick: number) {
  return Array(maxTick + 1)
    .fill(0)
    .map((_, i) => {
      return i + minTick;
    });
}

export function generateChartPreparation(
  FilteredSessions: SavedSessionResult[],
  ScheduleOption: SessionTerminationOptionsType,
  Perspective: 'Frequency' | 'Duration',
) {
  const generateData = FilteredSessions.map((result) => {
    function convertScheduleSetting(schedule: SessionTerminationOptionsType) {
      switch (schedule) {
        case 'End on Timer #1':
          return 'Primary';
        case 'End on Timer #2':
          return 'Secondary';
        case 'End on Timer #3':
          return 'Tertiary';
        default:
          throw Error('Invalid Schedule Option');
      }
    }

    function pullSessionTime(session: SavedSessionResult, schedule: SessionTerminationOptionsType) {
      switch (schedule) {
        case 'End on Timer #1':
          return session.TimerOne;
        case 'End on Timer #2':
          return session.TimerTwo;
        case 'End on Timer #3':
          return session.TimerThree;
        case 'End on Primary Timer':
          return session.TimerMain;
        default:
          throw Error('Invalid Schedule Option');
      }
    }

    const scores =
      Perspective === 'Frequency'
        ? result.Keyset.FrequencyKeys.map((key) => {
            return walkSessionFrequencyKey(result, convertScheduleSetting(ScheduleOption), key);
          })
        : result.Keyset.DurationKeys.map((key) => {
            return walkSessionDurationKey(result, convertScheduleSetting(ScheduleOption), key);
          });

    return {
      Session: result.SessionSettings.Session,
      SessionSettings: result.SessionSettings,
      Condition: result.SessionSettings.Condition,
      FrequencyKeyPresses: result.FrequencyKeyPresses,
      DurationKeyPresses: result.DurationKeyPresses,
      Schedule: ScheduleOption,
      SessionTime: pullSessionTime(result, ScheduleOption),
      Scores: scores,
    };
  });

  return generateData;
}
