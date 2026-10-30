import { describe, it, expect } from 'vitest';
import {
  DEFAULT_LEGEND_SETTINGS,
  LEGEND_CHART_POSITIONS,
  LEGEND_POSITIONS,
  isValidLegendSettings,
} from '../legend-settings';

describe('isValidLegendSettings', () => {
  it('accepts every position and layout combination', () => {
    for (const position of LEGEND_POSITIONS) {
      for (const layout of ['horizontal', 'vertical']) {
        expect(isValidLegendSettings({ position, layout })).toBe(true);
      }
    }
  });

  it('rejects unknown positions, unknown layouts, and non-objects', () => {
    expect(isValidLegendSettings({ position: 'center', layout: 'horizontal' })).toBe(false);
    expect(isValidLegendSettings({ position: 'below', layout: 'diagonal' })).toBe(false);
    expect(isValidLegendSettings({ position: 'below' })).toBe(false);
    expect(isValidLegendSettings(null)).toBe(false);
    expect(isValidLegendSettings('below')).toBe(false);
  });
});

describe('LEGEND_CHART_POSITIONS', () => {
  it('leaves the below-figure legend on the default bottom placement', () => {
    expect(LEGEND_CHART_POSITIONS[DEFAULT_LEGEND_SETTINGS.position]).toBeUndefined();
  });

  it('maps every other position to an inside Recharts position', () => {
    for (const position of LEGEND_POSITIONS.filter((value) => value !== 'below')) {
      expect(LEGEND_CHART_POSITIONS[position]).toMatch(/^inside/);
    }
  });
});
