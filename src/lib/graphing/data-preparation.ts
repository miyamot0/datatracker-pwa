import { SavedSessionResult } from '../dtos/session-results';
import { ProcessedSessionData } from '@/types/calculation';

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
