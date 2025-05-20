import { SessionTerminationOptionsType } from '@/forms/schema/session-designer-schema';
import { SavedSessionResult } from '@/lib/dtos';
import { walkSessionDurationKey, walkSessionFrequencyKey } from '../../viewer-results/helpers/schedule_parser';

export function FilterByPrimaryRole(results: SavedSessionResult[]) {
  return results
    .filter((result) => result.SessionSettings.Role === 'Primary')
    .sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session);
}

export function GetUniqueConditions(results: SavedSessionResult[]) {
  return Array.from(new Set(results.map((result) => result.SessionSettings.Condition)));
}

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
    default:
      throw Error('Invalid Schedule Option');
  }
}

export function generateChartPreparation(
  FilteredSessions: SavedSessionResult[],
  ScheduleOption: SessionTerminationOptionsType,
  Perspective: 'Frequency' | 'Duration'
) {
  let minX = 1;
  let maxX = 0;

  const generateData = FilteredSessions.map((result) => {
    if (minX > result.SessionSettings.Session) {
      minX = result.SessionSettings.Session;
    }

    if (maxX < result.SessionSettings.Session) {
      maxX = result.SessionSettings.Session;
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

  return {
    Data: generateData,
    MinX: minX,
    MaxX: maxX,
  };
}

export function generateTicks(XSpan: number, MinX: number) {
  return Array(XSpan + 1)
    .fill(0)
    .map((_, i) => {
      return i + MinX;
    });
}
