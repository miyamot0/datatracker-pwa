import { SessionTerminationOptionsType } from '@/types/terminations';
import { SavedSessionResult } from './dtos';
import { walkSessionDurationKey, walkSessionFrequencyKey } from './schedule-parser';
import { ToggleDisplayKey } from '@/types/visuals';
import { KeySetInstance, ExpandedKeySetInstance } from '@/types/keyset';
import { ModifiedSessionResult } from '@/types/storage';
import { FIGURE_PATH_COLORS } from './colors';
import { getShape } from './shapes';

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

/**
 * Extracts and deduplicates keysets from session results to create a dynamic keyset for visualization
 * @param results - Array of session results containing keysets
 * @returns An object containing deduplicated frequency and duration keys for use in visualizations
 */
export function extractAndDeduplicateKeysets(results: ModifiedSessionResult[]) {
  const allKeysets = results.map((result) => result.Keyset);
  const allFKeys = allKeysets.map((keyset) => keyset.FrequencyKeys).flat();
  const allDKeys = allKeysets.map((keyset) => keyset.DurationKeys).flat();

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

  return {
    frequencyKeys: targetedFKeys,
    durationKeys: targetedDKeys,
  };
}

/**
 * Maps keys with their storage preference visibility based on stored preferences
 */
export function mapKeysWithStoragePreference(keys: ToggleDisplayKey[], storedPreferences: any) {
  return keys.map((key) => {
    const shouldDisable = storedPreferences.KeyDescription.includes(key.KeyDescription);

    if (shouldDisable) {
      return {
        ...key,
        Visible: false,
      };
    }

    return key;
  });
}

/**
 * Creates CTB key with preferences and handling for exclusions
 */
export function createCTBKeyWithPreferences(keys: ToggleDisplayKey[], storedPreferences: any) {
  const ctbEntry = {
    KeyDescription: 'CTB',
    Visible: true,
  };

  // Map CTB exclusions
  const excludeFromCTB = keys.map((key) => {
    const shouldDisable = storedPreferences.CTBElements.includes(key.KeyDescription);

    if (shouldDisable) {
      return {
        ...key,
        Visible: false,
      };
    }

    return key;
  });

  return {
    ctbEntry,
    excludeFromCTB,
  };
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

/**
 * Prepares data for proportion visualization (percentage of session time)
 */
export function prepareProportionData(
  filteredSessions: SavedSessionResult[],
  scheduleOption: SessionTerminationOptionsType,
) {
  const data = generateChartPreparation(filteredSessions, scheduleOption, 'Duration');

  const preparedData = data.map((data) => {
    const temp_obj = {} as any;
    temp_obj.session = data.Session;
    temp_obj.Condition = data.Condition;
    temp_obj.SessionTime = data.SessionTime;

    data.Scores.map((key) => {
      temp_obj[`${key.KeyDescription}`] = (key.Value / data.SessionTime) * 100;
      temp_obj[`${key.KeyDescription}-Bouts`] = key.Bouts;
      temp_obj[`${key.KeyDescription}-Bout-Ave`] = key.Bouts > 0 ? (key.Value / key.Bouts).toFixed(2) : 0;
    });

    return temp_obj;
  });

  return { preparedData };
}

/**
 * Prepares data for rate visualization (counts per minute)
 */
export function prepareRateData(
  filteredSessions: SavedSessionResult[],
  scheduleOption: SessionTerminationOptionsType,
  ctbKeys: ExpandedKeySetInstance[],
) {
  const data = generateChartPreparation(filteredSessions, scheduleOption, 'Frequency');

  let maxY = 0;

  const preparedData = data.map((data) => {
    const temp_obj = {} as any;
    temp_obj.session = data.Session;
    temp_obj.Condition = data.Condition;
    temp_obj.SessionTime = data.SessionTime;

    const min_in_session = data.SessionTime / 60;

    data.Scores.map((key) => {
      const rate_calc = key.Value / min_in_session;
      temp_obj[`${key.KeyDescription}`] = rate_calc;

      if (maxY < rate_calc) {
        maxY = rate_calc;
      }
    });

    // Calculate CTB rate
    const ctb_calc = ctbKeys
      .filter((k) => k.Visible === true)
      .map((key) => {
        const pull_value = data.Scores.find((s) => s.KeyDescription === key.KeyDescription);
        return pull_value ? pull_value.Value : 0;
      })
      .reduce((a, b) => a + b, 0);

    temp_obj.CTB = ctb_calc / min_in_session;

    return temp_obj;
  });

  return { preparedData, maxY };
}
