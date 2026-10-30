/**
 * Font choices for a figure. 'default' uses the app font.
 */
export const FIGURE_FONT_FAMILIES = ['default', 'timesNewRoman'] as const;

export type FigureFontFamily = (typeof FIGURE_FONT_FAMILIES)[number];

export const FIGURE_FONT_STACKS: Record<FigureFontFamily, string> = {
  default: 'Inter, sans-serif',
  timesNewRoman: "'Times New Roman', serif",
};

export const DEFAULT_FIGURE_FONT_FAMILY: FigureFontFamily = 'default';

export const FIGURE_FONT_OPTIONS: { value: FigureFontFamily; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'timesNewRoman', label: 'Times New Roman' },
];

export function isValidFigureFontFamily(value: unknown): value is FigureFontFamily {
  return typeof value === 'string' && (FIGURE_FONT_FAMILIES as readonly string[]).includes(value);
}

/**
 * User overrides for the maximum tick on each axis. The minimum always comes from the data.
 */
export type FigureAxisMaxSettings = {
  overrideXMax: boolean;
  xMax: number | null;
  overrideYMax: boolean;
  yMax: number | null;
};

export const EMPTY_FIGURE_AXIS_MAX_SETTINGS: FigureAxisMaxSettings = {
  overrideXMax: false,
  xMax: null,
  overrideYMax: false,
  yMax: null,
};

function isValidMaxValue(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isInteger(value) && value > 0);
}

/**
 * Checks that a stored value has the shape of FigureAxisMaxSettings.
 */
export function isValidFigureAxisMaxSettings(value: unknown): value is FigureAxisMaxSettings {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.overrideXMax === 'boolean' &&
    isValidMaxValue(candidate.xMax) &&
    typeof candidate.overrideYMax === 'boolean' &&
    isValidMaxValue(candidate.yMax)
  );
}

/**
 * Returns the override when it is enabled, set, and above the data minimum, otherwise the data-derived maximum.
 */
export function resolveAxisMax(override: boolean, value: number | null, dataMin: number, dataMax: number): number {
  return override && value !== null && value > dataMin ? value : dataMax;
}
