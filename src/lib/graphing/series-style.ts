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
  shapes?: Record<string, SymbolType>;
  fillColors?: Record<string, string>;
  lineColors?: Record<string, string>;
};

export type ConditionSeriesStyle = {
  color?: string;
};

export const PHASE_LINE_TYPES = ['solid', 'dashed', 'dotted'] as const;

export type PhaseLineType = (typeof PHASE_LINE_TYPES)[number];

/** A vertical line drawn at an x position on the figure, such as a phase change between sessions */
export type PhaseChange = {
  position: number;
  lineType: PhaseLineType;
};

export const TEXT_ANCHORS = [
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'middle-center',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
] as const;

export type TextAnchor = (typeof TEXT_ANCHORS)[number];

export const TEXT_JUSTIFIES = ['left', 'center', 'right'] as const;

export type TextJustify = (typeof TEXT_JUSTIFIES)[number];

export const TEXT_WEIGHTS = ['normal', 'bold'] as const;

export type TextWeight = (typeof TEXT_WEIGHTS)[number];

/** The figure page a text annotation belongs to. Rate and proportion scale their y-axes differently. */
export const TEXT_PAGES = ['rate', 'proportion'] as const;

export type TextPage = (typeof TEXT_PAGES)[number];

/** Literal two-character sequence that separates lines within a text annotation label */
export const TEXT_LINE_BREAK = '\\n';

/** A text label drawn on the figure at a data coordinate */
export type TextAnnotation = {
  label: string;
  x: number;
  y: number;
  anchor: TextAnchor;
  justify: TextJustify;
  /** Font weight of the label. Treated as normal when absent, so annotations saved before this option still render. */
  weight?: TextWeight;
  /** Page the text was added on. Annotations saved before this option have no page and appear on both pages. */
  page?: TextPage;
};

/** A horizontal line drawn at a constant y position spanning from x1 to x2 on the figure */
export type AimLine = {
  x1: number;
  x2: number;
  y: number;
  lineType: PhaseLineType;
  color: string;
  /** Page the aim line was added on. Aim lines saved before this option have no page and appear on both pages. */
  page?: TextPage;
};

export type SeriesStyles = {
  KeyStyles: Record<string, KeySeriesStyle>;
  ConditionStyles: Record<string, ConditionSeriesStyle>;
  phase_changes: PhaseChange[];
  text_annotations: TextAnnotation[];
  aim_lines: AimLine[];
};

export const EMPTY_SERIES_STYLES: SeriesStyles = {
  KeyStyles: {},
  ConditionStyles: {},
  phase_changes: [],
  text_annotations: [],
  aim_lines: [],
};

/** Text annotations are always drawn black */
export const TEXT_ANNOTATION_COLOR = 'black';

/**
 * Splits a text annotation label into its lines at each literal \n
 */
export function splitTextAnnotationLines(label: string): string[] {
  return label.split(TEXT_LINE_BREAK);
}

/** Phase change lines are always drawn black */
export const PHASE_LINE_COLOR = 'black';

export const PHASE_LINE_DASH_ARRAY: Record<PhaseLineType, string | undefined> = {
  solid: undefined,
  dashed: '8 4',
  dotted: '2 3',
};

/**
 * Checks a saved phase change for a finite position above zero and a known line type
 */
export function isValidPhaseChange(value: unknown): value is PhaseChange {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const { position, lineType } = value as Partial<PhaseChange>;

  return (
    typeof position === 'number' &&
    Number.isFinite(position) &&
    position > 0 &&
    PHASE_LINE_TYPES.includes(lineType as PhaseLineType)
  );
}

export const SERIES_SHAPES: SymbolType[] = ['circle', 'cross', 'diamond', 'square', 'star', 'triangle', 'wye'];

/**
 * Checks a saved text annotation for a non-empty label, finite coordinates, and known anchor, justify, and weight values
 */
export function isValidTextAnnotation(value: unknown): value is TextAnnotation {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const { label, x, y, anchor, justify, weight, page } = value as Partial<TextAnnotation>;

  return (
    typeof label === 'string' &&
    splitTextAnnotationLines(label).some((line) => line.trim() !== '') &&
    typeof x === 'number' &&
    Number.isFinite(x) &&
    typeof y === 'number' &&
    Number.isFinite(y) &&
    TEXT_ANCHORS.includes(anchor as TextAnchor) &&
    TEXT_JUSTIFIES.includes(justify as TextJustify) &&
    (weight === undefined || TEXT_WEIGHTS.includes(weight as TextWeight)) &&
    (page === undefined || TEXT_PAGES.includes(page as TextPage))
  );
}

/**
 * Returns the text annotations that belong on a page. Annotations saved before pages existed have no page and show on every page.
 */
export function getPageTextAnnotations(annotations: TextAnnotation[], page: TextPage): TextAnnotation[] {
  return annotations.filter((annotation) => annotation.page === undefined || annotation.page === page);
}

/**
 * Checks a saved aim line for finite coordinates, a known line type, and a non-empty color
 */
export function isValidAimLine(value: unknown): value is AimLine {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const { x1, x2, y, lineType, color, page } = value as Partial<AimLine>;

  return (
    typeof x1 === 'number' &&
    Number.isFinite(x1) &&
    typeof x2 === 'number' &&
    Number.isFinite(x2) &&
    typeof y === 'number' &&
    Number.isFinite(y) &&
    PHASE_LINE_TYPES.includes(lineType as PhaseLineType) &&
    typeof color === 'string' &&
    color.trim() !== '' &&
    (page === undefined || TEXT_PAGES.includes(page as TextPage))
  );
}

/**
 * Returns the aim lines that belong on a page. Aim lines saved before pages existed have no page and show on every page.
 */
export function getPageAimLines(aimLines: AimLine[] | undefined, page: TextPage): AimLine[] {
  return (aimLines ?? []).filter((aimLine) => aimLine.page === undefined || aimLine.page === page);
}

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
 * Resolves the marker shape for a key within a condition. Precedence: key x condition override,
 * then the key shape, then the caller's default.
 */
export function resolveKeyConditionShape(
  styles: SeriesStyles,
  keyDescription: string,
  condition: string,
  defaultShape: SymbolType,
): SymbolType {
  const shape = styles.KeyStyles[keyDescription]?.shapes?.[condition];

  return shape && SERIES_SHAPES.includes(shape) ? shape : resolveKeyShape(styles, keyDescription, defaultShape);
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
 * then the caller's default. Line colours never fall back to the condition marker fill.
 */
export function resolveLineColor(
  styles: SeriesStyles,
  keyDescription: string,
  condition: string,
  defaultColor: string,
) {
  return styles.KeyStyles[keyDescription]?.lineColors?.[condition] ?? defaultColor;
}

/**
 * A key is hidden within a condition when both its marker fill and line are transparent. Hidden series are
 * not drawn, so they should also be omitted from tooltips.
 */
export function isSeriesHidden(styles: SeriesStyles, keyDescription: string, condition: string) {
  const fill = resolveKeyFillColor(styles, keyDescription, condition, MARKER_BORDER_COLOR);
  const line = resolveLineColor(styles, keyDescription, condition, DEFAULT_LINE_COLOR);

  return fill === TRANSPARENT_COLOR && line === TRANSPARENT_COLOR;
}
