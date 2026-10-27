import type { CartesianPosition } from 'recharts';

export const LEGEND_POSITIONS = [
  'below',
  'upper-right',
  'lower-right',
  'upper-left',
  'lower-left',
  'mid-left',
  'mid-right',
] as const;

export type LegendPosition = (typeof LEGEND_POSITIONS)[number];

export const LEGEND_LAYOUTS = ['horizontal', 'vertical'] as const;

export type LegendLayout = (typeof LEGEND_LAYOUTS)[number];

/**
 * How a figure's condition and key legend is placed and whether its entries run across or down.
 */
export type LegendSettings = {
  position: LegendPosition;
  layout: LegendLayout;
};

export const DEFAULT_LEGEND_SETTINGS: LegendSettings = {
  position: 'below',
  layout: 'horizontal',
};

export const LEGEND_POSITION_LABELS: Record<LegendPosition, string> = {
  below: 'Below Figure',
  'upper-right': 'Upper Right',
  'lower-right': 'Lower Right',
  'upper-left': 'Upper Left',
  'lower-left': 'Lower Left',
  'mid-left': 'Middle Left',
  'mid-right': 'Middle Right',
};

export const LEGEND_LAYOUT_LABELS: Record<LegendLayout, string> = {
  horizontal: 'Horizontal',
  vertical: 'Vertical',
};

/**
 * Recharts inside positions draw over the plot area. `below` uses the default bottom legend, so it has no position.
 */
export const LEGEND_CHART_POSITIONS: Record<LegendPosition, CartesianPosition | undefined> = {
  below: undefined,
  'upper-right': 'insideTopRight',
  'lower-right': 'insideBottomRight',
  'upper-left': 'insideTopLeft',
  'lower-left': 'insideBottomLeft',
  'mid-left': 'insideLeft',
  'mid-right': 'insideRight',
};

/**
 * Checks that a stored value has the shape of LegendSettings.
 */
export function isValidLegendSettings(value: unknown): value is LegendSettings {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    LEGEND_POSITIONS.includes(candidate.position as LegendPosition) &&
    LEGEND_LAYOUTS.includes(candidate.layout as LegendLayout)
  );
}
