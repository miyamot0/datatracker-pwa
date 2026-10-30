import { describe, it, expect } from 'vitest';
import { visualsSettingsReducer, type VisualsSettingsState } from '../visuals-settings-reducer';
import { EMPTY_SERIES_STYLES } from '@/lib/graphing/series-style';
import { EMPTY_FIGURE_LABEL_SETTINGS } from '@/lib/graphing/figure-labels';
import { DEFAULT_LEGEND_SETTINGS } from '@/lib/graphing/legend-settings';
import { EMPTY_FIGURE_AXIS_MAX_SETTINGS } from '@/lib/graphing/figure-text-settings';

function makeState(overrides: Partial<VisualsSettingsState> = {}): VisualsSettingsState {
  return {
    keys: [
      { KeyName: 'a', KeyCode: 1, KeyDescription: 'Key A', KeyType: 'Observed', Visible: true },
      { KeyName: 'b', KeyCode: 2, KeyDescription: 'Key B', KeyType: 'Derived', Visible: false },
    ],
    conditions: [
      { Condition: 'Baseline', Visible: true },
      { Condition: 'Treatment', Visible: true },
    ],
    schedule: { value: 'Default', label: 'Default' },
    figureTextSize: 'base',
    connectSpans: false,
    showTitle: true,
    showTooltip: true,
    showConditionLegend: true,
    showDescription: true,
    figureLabels: EMPTY_FIGURE_LABEL_SETTINGS,
    legendSettings: DEFAULT_LEGEND_SETTINGS,
    seriesStyles: EMPTY_SERIES_STYLES,
    ...overrides,
  };
}

describe('visualsSettingsReducer', () => {
  it('toggles only the matching key by description', () => {
    const next = visualsSettingsReducer(makeState(), {
      type: 'keyVisibilityChanged',
      keyDescription: 'Key B',
      visible: true,
    });

    expect(next.keys.map((k) => k.Visible)).toEqual([true, true]);
  });

  it('toggles only the matching condition', () => {
    const next = visualsSettingsReducer(makeState(), {
      type: 'conditionVisibilityChanged',
      condition: 'Treatment',
      visible: false,
    });

    expect(next.conditions).toEqual([
      { Condition: 'Baseline', Visible: true },
      { Condition: 'Treatment', Visible: false },
    ]);
  });

  it('does not mutate the previous state', () => {
    const state = makeState();
    const snapshot = structuredClone(state);

    visualsSettingsReducer(state, { type: 'keyVisibilityChanged', keyDescription: 'Key A', visible: false });
    visualsSettingsReducer(state, { type: 'conditionVisibilityChanged', condition: 'Baseline', visible: false });

    expect(state).toEqual(snapshot);
  });

  it('keeps rapid successive toggles from overwriting each other', () => {
    let state = makeState();
    state = visualsSettingsReducer(state, { type: 'keyVisibilityChanged', keyDescription: 'Key A', visible: false });
    state = visualsSettingsReducer(state, { type: 'keyVisibilityChanged', keyDescription: 'Key B', visible: true });
    state = visualsSettingsReducer(state, {
      type: 'conditionVisibilityChanged',
      condition: 'Baseline',
      visible: false,
    });
    state = visualsSettingsReducer(state, {
      type: 'conditionVisibilityChanged',
      condition: 'Treatment',
      visible: false,
    });

    expect(state.keys.map((k) => [k.KeyDescription, k.Visible])).toEqual([
      ['Key A', false],
      ['Key B', true],
    ]);
    expect(state.conditions.map((c) => c.Visible)).toEqual([false, false]);
  });

  it('updates the schedule', () => {
    const schedule = { value: 'Weekly', label: 'Weekly' };

    expect(visualsSettingsReducer(makeState(), { type: 'scheduleChanged', schedule }).schedule).toEqual(schedule);
  });

  it('updates the figure text size', () => {
    expect(visualsSettingsReducer(makeState(), { type: 'figureTextSizeChanged', size: 'large' }).figureTextSize).toBe(
      'large',
    );
  });

  it('updates connectSpans', () => {
    expect(visualsSettingsReducer(makeState(), { type: 'connectSpansChanged', connect: true }).connectSpans).toBe(true);
  });

  it('updates the boolean display flags', () => {
    const state = makeState();

    expect(visualsSettingsReducer(state, { type: 'showTitleChanged', show: false }).showTitle).toBe(false);
    expect(visualsSettingsReducer(state, { type: 'showTooltipChanged', show: false }).showTooltip).toBe(false);
    expect(visualsSettingsReducer(state, { type: 'showConditionLegendChanged', show: false }).showConditionLegend).toBe(
      false,
    );
    expect(visualsSettingsReducer(state, { type: 'showDescriptionChanged', show: false }).showDescription).toBe(false);
  });

  it('replaces figure labels, legend settings, and series styles', () => {
    const labels = { ...EMPTY_FIGURE_LABEL_SETTINGS };
    const legend = { ...DEFAULT_LEGEND_SETTINGS };
    const styles = { ...EMPTY_SERIES_STYLES };
    const state = makeState();

    expect(visualsSettingsReducer(state, { type: 'figureLabelsChanged', labels }).figureLabels).toBe(labels);
    expect(visualsSettingsReducer(state, { type: 'legendSettingsChanged', settings: legend }).legendSettings).toBe(
      legend,
    );
    expect(visualsSettingsReducer(state, { type: 'seriesStylesChanged', styles }).seriesStyles).toBe(styles);
  });

  it('updates the font family and axis max overrides', () => {
    const state = makeState();
    const axisMax = { ...EMPTY_FIGURE_AXIS_MAX_SETTINGS, overrideXMax: true, xMax: 40 };

    expect(visualsSettingsReducer(state, { type: 'fontFamilyChanged', fontFamily: 'timesNewRoman' }).fontFamily).toBe(
      'timesNewRoman',
    );
    expect(visualsSettingsReducer(state, { type: 'axisMaxChanged', axisMax }).axisMax).toBe(axisMax);
  });
});
