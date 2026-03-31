import { SessionTerminationOptionsType } from '@/types/terminations';
import { SavedSessionResult } from './dtos';
import { walkSessionDurationKeyStateAware, walkSessionFrequencyKey } from './schedule-parser';
import { ToggleDisplayKey } from '@/types/visuals';
import { KeySetInstance, ExpandedKeySetInstance, KeySet } from '@/types/keyset';
import { ModifiedSessionResult } from '@/types/storage';
import { FIGURE_PATH_COLORS } from './colors';
import { getShape } from './shapes';
import { evaluateLogic, LogicState } from './logic';
import { ProcessedSessionData } from '@/types/calculation';
import { ReturnLocalStorageCache } from './local_storage';

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
 * Extracts and deduplicates keysets from session results to create a dynamic keyset for visualization
 * @param results - Array of session results containing keysets
 * @returns An object containing deduplicated frequency and duration keys for use in visualizations
 */
export function extractAndDeduplicateKeysets(results: ModifiedSessionResult[], latestKeyset: KeySet) {
  const allKeysets = results.map((result) => result.Keyset);

  const allFKeys = [...allKeysets, latestKeyset].map((keyset) => keyset.FrequencyKeys).flat();
  const allDKeys = [...allKeysets, latestKeyset].map((keyset) => keyset.DurationKeys).flat();
  const allDerivedKeys = [...allKeysets, latestKeyset].map((keyset) => keyset.DerivedKeys || []).flat();
  const allSpecialDurationKeys = [...allKeysets, latestKeyset].map((keyset) => keyset.SpecialDurationKeys || []).flat();
  const allScorableDurationKeys = [...allKeysets, latestKeyset]
    .map((keyset) => keyset.ScorableDurationKeys || [])
    .flat();

  const targetedFKeys: KeySetInstance[] = [];
  allFKeys.forEach((key) => {
    if (!targetedFKeys.some((k) => k.KeyCode === key.KeyCode)) {
      targetedFKeys.push(key);
    }
  });

  const targetedDKeys: KeySetInstance[] = [];
  allDKeys.forEach((key) => {
    if (!targetedDKeys.some((k) => k.KeyCode === key.KeyCode)) {
      targetedDKeys.push(key);
    }
  });

  const targetedDerivedKeys: LogicState[] = [];
  allDerivedKeys.forEach((key) => {
    if (!targetedDerivedKeys.some((k) => k.id === key.id)) {
      targetedDerivedKeys.push(key);
    }
  });

  const targetedSpecialDurationKeys: KeySetInstance[] = [];
  allSpecialDurationKeys.forEach((key) => {
    if (!targetedSpecialDurationKeys.some((k) => k.KeyCode === key.KeyCode)) {
      targetedSpecialDurationKeys.push(key);
    }
  });

  const targetedScorableDurationKeys: KeySetInstance[] = [];
  allScorableDurationKeys.forEach((key) => {
    if (!targetedScorableDurationKeys.some((k) => k.KeyCode === key.KeyCode)) {
      targetedScorableDurationKeys.push(key);
    }
  });

  return {
    frequencyKeys: targetedFKeys,
    durationKeys: targetedDKeys,
    derivedKeys: targetedDerivedKeys,
    specialDurationKeys: targetedSpecialDurationKeys,
    scorableDurationKeys: targetedScorableDurationKeys,
  };
}

/**
 * Maps keys with their storage preference visibility based on stored preferences
 */
export function mapKeysWithStoragePreference(keys: ToggleDisplayKey[], storedPreferences: ReturnLocalStorageCache) {
  return keys.map((key) => {
    const shouldDisable = storedPreferences.KeyDescription.includes(key.KeyDescription);

    if (shouldDisable) {
      return {
        ...key,
        Visible: false,
      } satisfies ToggleDisplayKey;
    }

    return key;
  });
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
        session.SessionSettings.Session > prev &&
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
 * Creates legend items for chart visualization
 */
export function createChartLegends(filteredSessions: SavedSessionResult[], keySetFull: ExpandedKeySetInstance[]) {
  const conditionLegends = getUniqueSessionConditions(filteredSessions).map((condition, index) => ({
    id: condition,
    type: 'circle' as const,
    value: condition,
    color: FIGURE_PATH_COLORS[index % FIGURE_PATH_COLORS.length],
  }));

  const keyLegends = keySetFull
    .filter((key) => key.Visible === true)
    .map((item, index) => ({
      id: item.KeyDescription,
      type: getShape(index),
      value: item.KeyDescription,
      color: 'black',
    }));

  return [...conditionLegends, ...keyLegends];
}

/**
 * Common chart configuration and props
 */
export function getChartConfiguration() {
  return {
    noAnimationProps: {
      isAnimationActive: false,
      animationDuration: 0,
    },
    chartMargins: {
      top: 50,
      right: 10,
      left: 10,
      bottom: 10,
    },
    xAxisConfig: {
      height: 50,
      interval: 'equidistantPreserveStart' as const,
      minTickGap: 25,
      type: 'number' as const,
      dy: 5,
      padding: {
        left: 50,
        right: 50,
      },
      style: {
        stroke: 'black',
        strokeWidth: 1,
      },
    },
    yAxisConfig: {
      width: 50,
      padding: {
        left: 50,
        right: 50,
      },
      style: {
        stroke: 'black',
        strokeWidth: 1,
      },
    },
    yAxisStyle: {
      stroke: 'black',
      strokeWidth: 1,
    },
    labelStyle: {
      textAnchor: 'middle' as const,
      fill: 'black',
      fontWeight: 'bold',
    },
  };
}

/**
 * Creates navigation handler for chart points
 */
export function createNavigationHandler(navigate: any, group: string, individual: string, evaluation: string) {
  return (props: any) => {
    const stringIndex = `${props.session}_${props.Condition}_Primary`;
    navigate({
      to: '/session/$group/$individual/$evaluation/history/view/$file',
      params: {
        group,
        individual,
        evaluation,
        file: stringIndex,
      },
    });
  };
}

export function prepareProportionDataUniversal(ScoredSessions: ProcessedSessionData[]) {
  const preparedData = ScoredSessions.map((data) => {
    const temp_obj = {} as any;
    temp_obj.session = data.session;
    temp_obj.Condition = data.condition;
    temp_obj.SessionTime = data.timerDuration;

    data.durationKeys.map((key) => {
      temp_obj[`${key.keyDescription}`] = key.percentage;
      temp_obj[`${key.keyDescription}-Bouts`] = key.bouts;
      temp_obj[`${key.keyDescription}-Bout-Ave`] = key.averageBout;
    });

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

    data.frequencyKeys.map((key) => {
      if (key.rate && maxY < key.rate) {
        maxY = key.rate;
      }

      temp_obj[`${key.keyDescription}`] = key.rate;
    });

    data.derivedKeys.map((key) => {
      if (key.rate && maxY < key.rate) {
        maxY = key.rate;
      }

      temp_obj[`${key.keyDescription}`] = key.rate;
    });

    return temp_obj;
  });

  return { preparedData, maxY };
}
