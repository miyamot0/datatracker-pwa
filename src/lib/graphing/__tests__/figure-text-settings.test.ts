import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FIGURE_FONT_FAMILY,
  EMPTY_FIGURE_AXIS_MAX_SETTINGS,
  FIGURE_FONT_STACKS,
  isValidFigureAxisMaxSettings,
  isValidFigureFontFamily,
  resolveAxisMax,
} from '../figure-text-settings';

describe('figure font settings', () => {
  it('defaults to the app font and recognises both supported families', () => {
    expect(DEFAULT_FIGURE_FONT_FAMILY).toBe('default');
    expect(isValidFigureFontFamily('default')).toBe(true);
    expect(isValidFigureFontFamily('timesNewRoman')).toBe(true);
    expect(isValidFigureFontFamily('comic')).toBe(false);
    expect(FIGURE_FONT_STACKS.timesNewRoman).toContain('Times New Roman');
  });
});

describe('isValidFigureAxisMaxSettings', () => {
  it('accepts the empty settings and well-formed overrides', () => {
    expect(isValidFigureAxisMaxSettings(EMPTY_FIGURE_AXIS_MAX_SETTINGS)).toBe(true);
    expect(isValidFigureAxisMaxSettings({ overrideXMax: true, xMax: 40, overrideYMax: false, yMax: null })).toBe(true);
  });

  it('rejects non-boolean flags and non-positive or fractional values', () => {
    expect(isValidFigureAxisMaxSettings({ ...EMPTY_FIGURE_AXIS_MAX_SETTINGS, overrideXMax: 'yes' })).toBe(false);
    expect(isValidFigureAxisMaxSettings({ ...EMPTY_FIGURE_AXIS_MAX_SETTINGS, xMax: 0 })).toBe(false);
    expect(isValidFigureAxisMaxSettings({ ...EMPTY_FIGURE_AXIS_MAX_SETTINGS, yMax: 2.5 })).toBe(false);
    expect(isValidFigureAxisMaxSettings(null)).toBe(false);
  });
});

describe('resolveAxisMax', () => {
  it('uses the data max when the override is off or unset', () => {
    expect(resolveAxisMax(false, 40, 0, 12)).toBe(12);
    expect(resolveAxisMax(true, null, 0, 12)).toBe(12);
  });

  it('uses the override when it is above the data min', () => {
    expect(resolveAxisMax(true, 40, 0, 12)).toBe(40);
    expect(resolveAxisMax(true, 5, 3, 12)).toBe(5);
  });

  it('falls back to the data max when the override is at or below the data min', () => {
    expect(resolveAxisMax(true, 3, 3, 12)).toBe(12);
    expect(resolveAxisMax(true, 1, 3, 12)).toBe(12);
  });
});
