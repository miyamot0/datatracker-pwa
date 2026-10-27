import { describe, it, expect } from 'vitest';
import {
  EMPTY_FIGURE_LABEL_SETTINGS,
  FIGURE_LABEL_DEFAULTS,
  isValidFigureLabelSettings,
  resolveFigureLabels,
} from '../figure-labels';

describe('resolveFigureLabels', () => {
  const rateDefaults = FIGURE_LABEL_DEFAULTS.rate;

  it('uses the defaults when nothing is overridden', () => {
    expect(resolveFigureLabels(EMPTY_FIGURE_LABEL_SETTINGS, rateDefaults)).toEqual(rateDefaults);
  });

  it('uses override text when the override is enabled', () => {
    const settings = {
      ...EMPTY_FIGURE_LABEL_SETTINGS,
      overrideTitle: true,
      titleText: 'My Title',
      overrideXAxis: true,
      xAxisText: 'Day',
      overrideYAxis: true,
      yAxisText: 'Rate',
    };

    expect(resolveFigureLabels(settings, rateDefaults)).toEqual({ title: 'My Title', xAxis: 'Day', yAxis: 'Rate' });
  });

  it('ignores text when its override is not enabled', () => {
    const settings = { ...EMPTY_FIGURE_LABEL_SETTINGS, titleText: 'Hidden text', xAxisText: 'Hidden' };

    expect(resolveFigureLabels(settings, rateDefaults).title).toBe(rateDefaults.title);
    expect(resolveFigureLabels(settings, rateDefaults).xAxis).toBe(rateDefaults.xAxis);
  });

  it('falls back to the default when an enabled override is blank or whitespace', () => {
    const settings = {
      ...EMPTY_FIGURE_LABEL_SETTINGS,
      overrideTitle: true,
      titleText: '',
      overrideYAxis: true,
      yAxisText: '   ',
    };

    const resolved = resolveFigureLabels(settings, rateDefaults);

    expect(resolved.title).toBe(rateDefaults.title);
    expect(resolved.yAxis).toBe(rateDefaults.yAxis);
  });

  it('trims override text', () => {
    const settings = { ...EMPTY_FIGURE_LABEL_SETTINGS, overrideXAxis: true, xAxisText: '  Week  ' };

    expect(resolveFigureLabels(settings, rateDefaults).xAxis).toBe('Week');
  });

  it('keeps proportion defaults separate from rate defaults', () => {
    expect(FIGURE_LABEL_DEFAULTS.proportion.yAxis).toBe('Percentage of Session');
    expect(FIGURE_LABEL_DEFAULTS.rate.yAxis).toBe('Responses per Min');
  });
});

describe('isValidFigureLabelSettings', () => {
  it('accepts a complete settings object', () => {
    expect(isValidFigureLabelSettings(EMPTY_FIGURE_LABEL_SETTINGS)).toBe(true);
  });

  it('rejects null, primitives, and partial objects', () => {
    expect(isValidFigureLabelSettings(null)).toBe(false);
    expect(isValidFigureLabelSettings('title')).toBe(false);
    expect(isValidFigureLabelSettings({ overrideTitle: true })).toBe(false);
  });

  it('rejects fields with the wrong type', () => {
    expect(isValidFigureLabelSettings({ ...EMPTY_FIGURE_LABEL_SETTINGS, overrideTitle: 'yes' })).toBe(false);
    expect(isValidFigureLabelSettings({ ...EMPTY_FIGURE_LABEL_SETTINGS, titleText: 5 })).toBe(false);
  });
});
