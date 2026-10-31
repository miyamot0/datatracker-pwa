import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as storage from '@/lib/local_storage';
import { type ToggleDisplayKey } from '@/types/visuals';
import { useVisualsSettings, type VisualsSettingsOptions } from '../use-visuals-settings';

vi.mock('@/lib/local_storage', () => ({
  getLocalCachedPrefs: vi.fn(() => ({ KeyDescription: [], Schedule: [] })),
  getLocalFigureTextSize: vi.fn(() => 'base'),
  setLocalFigureTextSize: vi.fn(),
  getLocalHiddenConditions: vi.fn(() => []),
  setLocalHiddenConditions: vi.fn(),
  getLocalFigureFontFamily: vi.fn(() => 'default'),
  setLocalFigureFontFamily: vi.fn(),
  getLocalFigureAxisMax: vi.fn(() => ({ overrideXMax: false, xMax: null, overrideYMax: false, yMax: null })),
  setLocalFigureAxisMax: vi.fn(),
  getLocalConnectSpans: vi.fn(() => false),
  getLocalFigureLabels: vi.fn(() => ({ xAxis: 'X', yAxis: 'Y' })),
  getLocalLegendSettings: vi.fn(() => ({ position: 'bottom' })),
  getLocalSeriesStyles: vi.fn(() => ({})),
  getLocalShowConditionLegend: vi.fn(() => true),
  getLocalShowKeyLegend: vi.fn(() => true),
  getLocalShowDescription: vi.fn(() => false),
  getLocalShowTitle: vi.fn(() => true),
  getLocalShowTooltip: vi.fn(() => true),
  setLocalCachedPrefs: vi.fn(),
  setLocalConnectSpans: vi.fn(),
  setLocalFigureLabels: vi.fn(),
  setLocalLegendSettings: vi.fn(),
  setLocalSeriesStyles: vi.fn(),
  setLocalShowConditionLegend: vi.fn(),
  setLocalShowKeyLegend: vi.fn(),
  getLocalSingleTarget: vi.fn(() => false),
  setLocalSingleTarget: vi.fn(),
  setLocalShowDescription: vi.fn(),
  setLocalShowTitle: vi.fn(),
  setLocalShowTooltip: vi.fn(),
}));

const observedKey = (description: string) =>
  ({ KeyType: 'Observed', KeyDescription: description, Visible: true }) as unknown as ToggleDisplayKey;

const derivedKey = (description: string) =>
  ({ KeyType: 'Derived', KeyDescription: description, Visible: true }) as unknown as ToggleDisplayKey;

const baseOptions: VisualsSettingsOptions = {
  group: 'G',
  individual: 'I',
  evaluation: 'E',
  plot: 'Rate',
  prefsType: 'Rate',
  keys: [observedKey('Alpha'), derivedKey('Beta')],
  conditions: ['Baseline', 'Treatment'],
  defaultSchedule: { value: 'daily', label: 'Daily' },
};

describe('useVisualsSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates keys sorted by KeyType, conditions as visible, and persisted values', () => {
    const { result } = renderHook(() => useVisualsSettings(baseOptions));
    const [state] = result.current;

    expect(state.keys.map((key) => key.KeyType)).toEqual(['Observed', 'Derived']);
    expect(state.conditions).toEqual([
      { Condition: 'Baseline', Visible: true },
      { Condition: 'Treatment', Visible: true },
    ]);
    expect(state.schedule).toEqual({ value: 'daily', label: 'Daily' });
    expect(state.figureTextSize).toBe('base');
    expect(state.showTitle).toBe(true);
    expect(state.connectSpans).toBe(false);
    expect(storage.getLocalShowTitle).toHaveBeenCalledWith('G', 'I', 'E', 'Rate');
  });

  it('does not write any setting on first render', () => {
    renderHook(() => useVisualsSettings(baseOptions));

    expect(storage.setLocalConnectSpans).not.toHaveBeenCalled();
    expect(storage.setLocalShowTitle).not.toHaveBeenCalled();
    expect(storage.setLocalCachedPrefs).not.toHaveBeenCalled();
  });

  it('persists connect spans with plot scope when it changes', () => {
    const { result } = renderHook(() => useVisualsSettings(baseOptions));

    act(() => result.current[1]({ type: 'connectSpansChanged', connect: true }));

    expect(storage.setLocalConnectSpans).toHaveBeenCalledWith('G', 'I', 'E', 'Rate', true);
  });

  it('persists show title, tooltip, condition legend, and description', () => {
    const { result } = renderHook(() => useVisualsSettings(baseOptions));

    act(() => {
      result.current[1]({ type: 'showTitleChanged', show: false });
      result.current[1]({ type: 'showTooltipChanged', show: false });
      result.current[1]({ type: 'showConditionLegendChanged', show: false });
      result.current[1]({ type: 'showDescriptionChanged', show: true });
    });

    expect(storage.setLocalShowTitle).toHaveBeenCalledWith('G', 'I', 'E', 'Rate', false);
    expect(storage.setLocalShowTooltip).toHaveBeenCalledWith('G', 'I', 'E', false);
    expect(storage.setLocalShowConditionLegend).toHaveBeenCalledWith('G', 'I', 'E', false);
    expect(storage.setLocalShowDescription).toHaveBeenCalledWith('G', 'I', 'E', true);
  });

  it('persists figure labels and legend settings with plot scope', () => {
    const { result } = renderHook(() => useVisualsSettings(baseOptions));
    const labels = { xAxis: 'Days', yAxis: 'Count' };
    const legend = { position: 'right' };

    act(() => {
      result.current[1]({ type: 'figureLabelsChanged', labels: labels as never });
      result.current[1]({ type: 'legendSettingsChanged', settings: legend as never });
    });

    expect(storage.setLocalFigureLabels).toHaveBeenCalledWith('G', 'I', 'E', 'Rate', labels);
    expect(storage.setLocalLegendSettings).toHaveBeenCalledWith('G', 'I', 'E', 'Rate', legend);
  });

  it('persists series styles without plot scope', () => {
    const { result } = renderHook(() => useVisualsSettings(baseOptions));
    const styles = { Alpha: { color: 'red' } };

    act(() => result.current[1]({ type: 'seriesStylesChanged', styles: styles as never }));

    expect(storage.setLocalSeriesStyles).toHaveBeenCalledWith('G', 'I', 'E', styles);
  });

  it('persists hidden key descriptions and the schedule as cached prefs', () => {
    const { result } = renderHook(() => useVisualsSettings(baseOptions));

    act(() => {
      result.current[1]({ type: 'keyVisibilityChanged', keyDescription: 'Alpha', visible: false });
    });

    expect(storage.setLocalCachedPrefs).toHaveBeenCalledWith('G', 'I', 'E', 'Rate', {
      KeyDescription: ['Alpha'],
      Schedule: 'daily',
    });
  });

  it('updates the schedule in state', () => {
    const { result } = renderHook(() => useVisualsSettings(baseOptions));

    act(() => result.current[1]({ type: 'scheduleChanged', schedule: { value: 'weekly', label: 'Weekly' } }));

    expect(result.current[0].schedule).toEqual({ value: 'weekly', label: 'Weekly' });
  });

  it('persists a schedule change on its own as cached prefs', () => {
    const { result } = renderHook(() => useVisualsSettings(baseOptions));

    act(() => result.current[1]({ type: 'scheduleChanged', schedule: { value: 'weekly', label: 'Weekly' } }));

    expect(storage.setLocalCachedPrefs).toHaveBeenCalledWith('G', 'I', 'E', 'Rate', {
      KeyDescription: [],
      Schedule: 'weekly',
    });
  });

  it('keeps hidden keys when only the schedule changes', () => {
    const { result } = renderHook(() => useVisualsSettings(baseOptions));

    act(() => {
      result.current[1]({ type: 'keyVisibilityChanged', keyDescription: 'Alpha', visible: false });
    });
    act(() => result.current[1]({ type: 'scheduleChanged', schedule: { value: 'weekly', label: 'Weekly' } }));

    expect(storage.setLocalCachedPrefs).toHaveBeenLastCalledWith('G', 'I', 'E', 'Rate', {
      KeyDescription: ['Alpha'],
      Schedule: 'weekly',
    });
  });

  it('uses the Duration prefs scope when configured', () => {
    const { result } = renderHook(() => useVisualsSettings({ ...baseOptions, prefsType: 'Duration' }));

    act(() => result.current[1]({ type: 'keyVisibilityChanged', keyDescription: 'Beta', visible: false }));

    expect(storage.setLocalCachedPrefs).toHaveBeenCalledWith('G', 'I', 'E', 'Duration', {
      KeyDescription: ['Beta'],
      Schedule: 'daily',
    });
  });

  it('does not persist again when a dispatch leaves a value unchanged', () => {
    const { result } = renderHook(() => useVisualsSettings(baseOptions));

    act(() => result.current[1]({ type: 'showTitleChanged', show: true }));

    expect(storage.setLocalShowTitle).not.toHaveBeenCalled();
  });
});
