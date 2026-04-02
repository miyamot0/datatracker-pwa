import { SessionTerminationOptionsType } from '@/types/terminations';
import { SavedSessionResult } from '../dtos';
import { walkSessionDurationKeyStateAware, walkSessionFrequencyKey } from '../schedule-parser';
import { ExpandedKeySetInstance } from '@/types/keyset/display';
import { KeySet } from '@/types/keyset/core';
import { evaluateLogic } from '../logic';
import { ProcessedSessionData } from '@/types/calculation';

/**
 * Prepares data for complete chart visualization with all key types
 */
export function generateChartPreparation(
  FilteredSessions: SavedSessionResult[],
  ScheduleOption: SessionTerminationOptionsType,
  Perspective: 'Frequency' | 'Duration',
  KeySetFull?: ExpandedKeySetInstance[],
  DynamicKeySet?: KeySet,
) {
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

  const generateData = FilteredSessions.map((result) => {
    const scores =
      Perspective === 'Frequency'
        ? result.Keyset.FrequencyKeys.map((key) => {
            return walkSessionFrequencyKey(result, convertScheduleSetting(ScheduleOption), key);
          })
        : result.Keyset.DurationKeys.map((key) => {
            return walkSessionDurationKeyStateAware(result, convertScheduleSetting(ScheduleOption), key);
          });

    const newScores = DynamicKeySet?.DerivedKeys.map((logicalState) => {
      const updatedKeys = logicalState.fields.map((field) => {
        const foundKey = scores.find((score) => score.KeyDescription === field.KeyDescription);
        return {
          ...field,
          Value: foundKey ? foundKey.Value : NaN,
        };
      });

      const newLogicalState = {
        ...logicalState,
        fields: updatedKeys,
      };

      const calculatedValue = evaluateLogic(newLogicalState);

      return {
        ...logicalState,
        Value: calculatedValue,
      };
    });

    for (const newValues of newScores || []) {
      const relevantKey = KeySetFull?.find((key) => key.KeyDescription === newValues.name);

      if (relevantKey && relevantKey.Visible === true) {
        scores.push({
          KeyName: newValues.name,
          KeyDescription: newValues.name,
          Value: newValues.Value,
          Schedule: convertScheduleSetting(ScheduleOption),
          Bouts: -1,
        });
      }
    }

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

/**
 * Creates split points for line charts to handle condition changes
 */
export function calculateSplitPoints(
  conditionData: any[],
  filteredSessions: SavedSessionResult[],
  conditionName: string,
) {
  const splitPoints = [] as number[];

  for (let i = 1; i < conditionData.length; i++) {
    const current = conditionData[i].session;
    const prev = conditionData[i - 1].session;

    const checkedData = filteredSessions.filter(
      (session) =>
        session?.SessionSettings?.Session > prev &&
        session.SessionSettings.Session < current &&
        session.SessionSettings.Condition !== conditionName,
    );

    if (checkedData.length > 0) {
      splitPoints.push(i);
    }
  }

  return splitPoints;
}

/**
 * Prepares data for proportion visualization (duration-based metrics)
 */
export function prepareProportionDataUniversal(ScoredSessions: ProcessedSessionData[]) {
  const preparedData = ScoredSessions.map((data) => {
    const temp_obj = {} as any;
    temp_obj.session = data.session;
    temp_obj.Condition = data.condition;
    temp_obj.SessionTime = data.timerDuration;

    if (data.durationKeys) {
      data.durationKeys.map((key) => {
        temp_obj[`${key.keyDescription}`] = key.percentage;
        temp_obj[`${key.keyDescription}-Bouts`] = key.bouts;
        temp_obj[`${key.keyDescription}-Bout-Ave`] = key.averageBout;
      });
    }

    return temp_obj;
  });

  return { preparedData };
}

/**
 * Prepares data for rate visualization using universal approach.
 *
 * @param ScoredSessions - Array of processed session data with frequency keys and derived keys already calculated
 * @returns An object containing the prepared data for visualization and the maximum Y value for scaling the chart
 */
export function prepareRateDataUniversal(ScoredSessions: ProcessedSessionData[]) {
  let maxY = 0;

  // Note: this is session-by-session grouping
  const preparedData = ScoredSessions.map((data) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const temp_obj = {} as any;

    temp_obj.session = data.session;
    temp_obj.Condition = data.condition;
    temp_obj.SessionTime = data.timerDuration;

    if (data.frequencyKeys) {
      data.frequencyKeys.map((key) => {
        if (key.rate && maxY < key.rate) {
          maxY = key.rate;
        }

        temp_obj[`${key.keyDescription}`] = key.rate;
      });
    }

    if (data.derivedKeys) {
      data.derivedKeys.map((key) => {
        if (key.rate && maxY < key.rate) {
          maxY = key.rate;
        }

        temp_obj[`${key.keyDescription}`] = key.rate;
      });
    }

    return temp_obj;
  });

  return { preparedData, maxY };
}
