import { SavedSessionResult } from '../dtos';
import { FIGURE_PATH_COLORS } from '../colors';
import { getShape } from '../shapes';
import { getUniqueSessionConditions } from './session-filters';
import { ExpandedKeySetInstance } from '@/types/keyset/display';

/**
 * Generates an array of tick values for chart axes
 */
export function generateTicks(maxTick: number, minTick: number) {
  // Handle edge cases where maxTick is negative or results in invalid array length
  if (maxTick < 0 || !Number.isFinite(maxTick) || !Number.isFinite(minTick)) {
    return [];
  }

  const length = maxTick + 1;
  if (length <= 0) {
    return [];
  }

  return Array(length)
    .fill(0)
    .map((_, i) => {
      return i + minTick;
    });
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
