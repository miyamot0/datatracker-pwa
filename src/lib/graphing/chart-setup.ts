import { SavedSessionResult } from '../dtos/session-results';
import { FIGURE_PATH_COLORS } from '../colors';
import { getShape } from '../shapes';
import { getUniqueSessionConditions } from './session-filters';
import { ExpandedKeySetInstance } from '@/types/keyset/display';
import type { FigureVisualSizing } from '@/types/accessibility';
import {
  EMPTY_SERIES_STYLES,
  MARKER_BORDER_COLOR,
  resolveFillColor,
  resolveKeyShape,
  type SeriesStyles,
} from './series-style';

/**
 * Generates an array of tick values for chart axes
 */
export function generateTicks(maxTick: number, minTick: number) {
  if (!Number.isFinite(maxTick) || !Number.isFinite(minTick)) {
    return [];
  }

  // Inclusive range, so the first and last ticks are exactly minTick and maxTick
  const length = maxTick - minTick + 1;
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
export function createChartLegends(
  filteredSessions: SavedSessionResult[],
  keySetFull: ExpandedKeySetInstance[],
  seriesStyles: SeriesStyles = EMPTY_SERIES_STYLES,
) {
  const conditionLegends = getUniqueSessionConditions(filteredSessions).map((condition, index) => ({
    id: condition,
    kind: 'condition' as const,
    type: 'circle' as const,
    value: condition,
    color: resolveFillColor(seriesStyles, condition, FIGURE_PATH_COLORS[index % FIGURE_PATH_COLORS.length]),
  }));

  const keyLegends = keySetFull
    .filter((key) => key.Visible === true)
    .map((item, index) => ({
      id: item.KeyDescription,
      kind: 'key' as const,
      type: resolveKeyShape(seriesStyles, item.KeyDescription, getShape(index)),
      value: item.KeyDescription,
      color: MARKER_BORDER_COLOR,
    }));

  return [...conditionLegends, ...keyLegends];
}

export type ChartVerticalSpacing = {
  /** Title font size in px */
  titleFontPx: number;
  /** Vertical center of the title, measured from the top of the chart */
  titleY: number;
  /** Space reserved above the plot for the title */
  chartMarginTop: number;
  /** Total height of the chart container in px */
  chartHeight: number;
  /** Height of the x-axis band (tick labels + axis title) in px */
  xAxisHeight: number;
  /** Gap between the bottom of the x-axis band and the x-axis title baseline in px */
  xAxisLabelOffset: number;
};

/**
 * Vertical spacing per figure text size. Larger rows add room for the larger title and axis text.
 * chartHeight grows by the same amount as the x-axis band, so the plot area stays roughly constant.
 */
const VERTICAL_SPACING_BY_TEXT_SIZE: Record<FigureVisualSizing, ChartVerticalSpacing> = {
  base: {
    titleFontPx: 24,
    titleY: 25,
    chartMarginTop: 62,
    chartHeight: 522,
    xAxisHeight: 60,
    xAxisLabelOffset: 0,
  },
  large: {
    titleFontPx: 30,
    titleY: 30,
    chartMarginTop: 76,
    chartHeight: 556,
    xAxisHeight: 70,
    xAxisLabelOffset: 4,
  },
  extraLarge: {
    titleFontPx: 36,
    titleY: 36,
    chartMarginTop: 92,
    chartHeight: 592,
    xAxisHeight: 82,
    xAxisLabelOffset: 8,
  },
};

/**
 * Top margin used when the title is hidden. The title's space is given back to the plot area.
 */
const UNTITLED_CHART_MARGIN_TOP = 12;

/**
 * Returns the vertical spacing (title, top margin, x-axis band, chart height) for a figure text size.
 * With the title hidden, the top margin shrinks so the plot area reclaims the title's space.
 */
export function getChartVerticalSpacing(figureTextSize: FigureVisualSizing, showTitle = true): ChartVerticalSpacing {
  const spacing = { ...VERTICAL_SPACING_BY_TEXT_SIZE[figureTextSize] };
  if (!showTitle) {
    spacing.chartMarginTop = UNTITLED_CHART_MARGIN_TOP;
  }
  return spacing;
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
      interval: 'preserveStartEnd' as const,
      minTickGap: 25,
      type: 'number' as const,
      dy: 5,
      padding: {
        left: 25,
        right: 25,
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
