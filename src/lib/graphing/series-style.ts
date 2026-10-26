import { SymbolType } from 'recharts/types/util/types';
import { FIGURE_PATH_COLORS } from '@/lib/colors';

/** Marker borders are fixed and never user-editable */
export const MARKER_BORDER_COLOR = 'black';

/** Hides a key within a condition when used as its marker fill or line colour */
export const TRANSPARENT_COLOR = 'transparent';

/**
 * Marker border for a fill. A transparent fill hides the whole marker, including its border.
 */
export function resolveMarkerStroke(fill: string) {
  return fill === TRANSPARENT_COLOR ? TRANSPARENT_COLOR : MARKER_BORDER_COLOR;
}

export type KeySeriesStyle = {
  shape?: SymbolType;
  fillColors?: Record<string, string>;
  lineColors?: Record<string, string>;
};

export type ConditionSeriesStyle = {
  color?: string;
};

export type SeriesStyles = {
  KeyStyles: Record<string, KeySeriesStyle>;
  ConditionStyles: Record<string, ConditionSeriesStyle>;
};

export const EMPTY_SERIES_STYLES: SeriesStyles = { KeyStyles: {}, ConditionStyles: {} };

export const SERIES_SHAPES: SymbolType[] = ['circle', 'cross', 'diamond', 'square', 'star', 'triangle', 'wye'];

export const SERIES_COLOR_PALETTE: string[] = [...FIGURE_PATH_COLORS, '#000000', '#FFFFFF'];

export const DEFAULT_LINE_COLOR = 'black';

/**
 * Resolves the marker shape for a key, falling back to the caller's default when no valid override is saved
 */
export function resolveKeyShape(styles: SeriesStyles, keyDescription: string, defaultShape: SymbolType): SymbolType {
  const shape = styles.KeyStyles[keyDescription]?.shape;

  return shape && SERIES_SHAPES.includes(shape) ? shape : defaultShape;
}

/**
 * Resolves the marker fill for a condition. A saved condition colour applies to the fill.
 */
export function resolveFillColor(styles: SeriesStyles, condition: string, defaultColor: string) {
  return styles.ConditionStyles[condition]?.color ?? defaultColor;
}

/**
 * Resolves the marker fill for a key within a condition. Precedence: key × condition override,
 * then the condition colour, then the caller's default.
 */
export function resolveKeyFillColor(
  styles: SeriesStyles,
  keyDescription: string,
  condition: string,
  defaultColor: string,
) {
  return styles.KeyStyles[keyDescription]?.fillColors?.[condition] ?? resolveFillColor(styles, condition, defaultColor);
}

/**
 * Resolves the line colour for a key within a condition. Precedence: key × condition override,
 * then the condition colour, then the caller's default.
 */
export function resolveLineColor(
  styles: SeriesStyles,
  keyDescription: string,
  condition: string,
  defaultColor: string,
) {
  return styles.KeyStyles[keyDescription]?.lineColors?.[condition] ?? defaultColor;
}
