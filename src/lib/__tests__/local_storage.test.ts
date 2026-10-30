import {
  getLocalCachedPrefs,
  getLocalConnectSpans,
  getLocalFigureLabels,
  getLocalLegendSettings,
  getLocalSeriesStyles,
  getLocalShowTitle,
  getLocalShowTooltip,
  getLocalShowConditionLegend,
  getLocalShowDescription,
  ReturnLocalStorageCache,
  setLocalCachedPrefs,
  setLocalLegendSettings,
  setLocalShowConditionLegend,
  setLocalShowDescription,
  setLocalShowTooltip,
  setLocalConnectSpans,
  setLocalFigureLabels,
  setLocalSeriesStyles,
  setLocalShowTitle,
} from '../local_storage'; // Adjust the import path
import { EMPTY_FIGURE_LABEL_SETTINGS } from '../graphing/figure-labels';
import { DEFAULT_LEGEND_SETTINGS } from '../graphing/legend-settings';

describe('LocalStorage Prefs', () => {
  const group = 'group1';
  const individual = 'individual1';
  const evaluation = 'evaluation1';
  const type = 'Rate';
  const dynamicKey = `${group}_${individual}_${evaluation}_${type}`;

  const mockCache = {
    KeyDescription: ['Key1', 'Key2'],
    CTBElements: ['Element1'],
    Schedule: 'End on Timer #2',
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getLocalCachedPrefs', () => {
    it('should return the cached object from localStorage if it exists', () => {
      localStorage.setItem(dynamicKey, JSON.stringify(mockCache));

      const result = getLocalCachedPrefs(group, individual, evaluation, type);
      expect(result).toEqual(mockCache);
    });

    it('should return the default object if localStorage does not contain the key', () => {
      const defaultCache = {
        KeyDescription: [],
        Schedule: 'End on Timer #1',
      };

      const result = getLocalCachedPrefs(group, individual, evaluation, type);
      expect(result).toEqual(defaultCache);
    });
  });

  describe('setLocalCachedPrefs', () => {
    it('should set the cached object in localStorage', () => {
      setLocalCachedPrefs(group, individual, evaluation, type, mockCache as ReturnLocalStorageCache);

      const storedValue = localStorage.getItem(dynamicKey);
      expect(storedValue).toEqual(JSON.stringify(mockCache));
    });

    it('should correctly handle leading/trailing spaces in the group, individual, and evaluation parameters', () => {
      const groupWithSpaces = ' group1 ';
      const individualWithSpaces = ' individual1 ';
      const evaluationWithSpaces = ' evaluation1 ';

      const trimmedKey = `${group.trim()}_${individual.trim()}_${evaluation.trim()}_${type}`;

      setLocalCachedPrefs(
        groupWithSpaces,
        individualWithSpaces,
        evaluationWithSpaces,
        type,
        mockCache as ReturnLocalStorageCache,
      );

      const storedValue = localStorage.getItem(trimmedKey);
      expect(storedValue).toEqual(JSON.stringify(mockCache));
    });
  });

  describe('series styles', () => {
    it('returns empty styles when nothing has been saved', () => {
      expect(getLocalSeriesStyles('group1', 'individual1', 'evaluation1')).toEqual({
        KeyStyles: {},
        ConditionStyles: {},
        phase_changes: [],
        text_annotations: [],
        aim_lines: [],
      });
    });

    it('stores under the trimmed group, individual, and evaluation key', () => {
      const styles = {
        KeyStyles: { Hitting: { shape: 'star' as const } },
        ConditionStyles: {},
        phase_changes: [],
        text_annotations: [],
        aim_lines: [],
      };

      setLocalSeriesStyles(' group1 ', ' individual1 ', ' evaluation1 ', styles);

      expect(localStorage.getItem('group1_individual1_evaluation1_SeriesStyles')).toBe(JSON.stringify(styles));
      expect(getLocalSeriesStyles('group1', 'individual1', 'evaluation1')).toEqual(styles);
    });

    it('does not share styles across a different individual or evaluation', () => {
      const styles = {
        KeyStyles: {},
        ConditionStyles: { Baseline: { color: '#FF0000' } },
        phase_changes: [],
        text_annotations: [],
        aim_lines: [],
      };

      setLocalSeriesStyles('group1', 'individual1', 'evaluation1', styles);

      expect(getLocalSeriesStyles('group1', 'individual2', 'evaluation1')).toEqual({
        KeyStyles: {},
        ConditionStyles: {},
        phase_changes: [],
        text_annotations: [],
        aim_lines: [],
      });
      expect(getLocalSeriesStyles('group1', 'individual1', 'evaluation2')).toEqual({
        KeyStyles: {},
        ConditionStyles: {},
        phase_changes: [],
        text_annotations: [],
        aim_lines: [],
      });
    });

    it('fills in a missing section when a saved object is partial', () => {
      localStorage.setItem(
        'group1_individual1_evaluation1_SeriesStyles',
        JSON.stringify({ KeyStyles: { Hitting: { shape: 'star' } } }),
      );

      expect(getLocalSeriesStyles('group1', 'individual1', 'evaluation1')).toEqual({
        KeyStyles: { Hitting: { shape: 'star' } },
        ConditionStyles: {},
        phase_changes: [],
        text_annotations: [],
        aim_lines: [],
      });
    });

    it('keeps only valid text annotations when reading saved styles', () => {
      localStorage.setItem(
        'group1_individual1_evaluation1_SeriesStyles',
        JSON.stringify({
          KeyStyles: {},
          ConditionStyles: {},
          phase_changes: [],
          text_annotations: [
            { label: 'Baseline\\nStart', x: 2, y: 50, anchor: 'top-left', justify: 'left' },
            { label: '   ', x: 2, y: 50, anchor: 'top-left', justify: 'left' },
            { label: 'Bad anchor', x: 2, y: 50, anchor: 'middle', justify: 'left' },
            { label: 'Bad x', x: '2', y: 50, anchor: 'top-left', justify: 'left' },
            { label: 'Bad justify', x: 2, y: 50, anchor: 'top-left', justify: 'justify' },
          ],
        }),
      );

      expect(getLocalSeriesStyles('group1', 'individual1', 'evaluation1').text_annotations).toEqual([
        { label: 'Baseline\\nStart', x: 2, y: 50, anchor: 'top-left', justify: 'left' },
      ]);
    });

    it('keeps only valid aim lines when reading saved styles', () => {
      localStorage.setItem(
        'group1_individual1_evaluation1_SeriesStyles',
        JSON.stringify({
          KeyStyles: {},
          ConditionStyles: {},
          phase_changes: [],
          text_annotations: [],
          aim_lines: [
            { x1: 1, x2: 5, y: 40, lineType: 'dashed', color: '#9061C2', page: 'rate' },
            { x1: 1, x2: 5, y: 40, lineType: 'wavy', color: '#9061C2' },
            { x1: '1', x2: 5, y: 40, lineType: 'solid', color: '#9061C2' },
            { x1: 1, x2: 5, y: 40, lineType: 'solid', color: '' },
            { x1: 1, x2: 5, y: 40, lineType: 'solid', color: '#000000', page: 'phase' },
          ],
        }),
      );

      expect(getLocalSeriesStyles('group1', 'individual1', 'evaluation1').aim_lines).toEqual([
        { x1: 1, x2: 5, y: 40, lineType: 'dashed', color: '#9061C2', page: 'rate' },
      ]);
    });

    it('keeps only valid phase changes when reading saved styles', () => {
      localStorage.setItem(
        'group1_individual1_evaluation1_SeriesStyles',
        JSON.stringify({
          KeyStyles: {},
          ConditionStyles: {},
          phase_changes: [
            { position: 3.5, lineType: 'dashed' },
            { position: 0, lineType: 'solid' },
            { position: -1, lineType: 'solid' },
            { position: 4, lineType: 'wavy' },
            { position: '5', lineType: 'dotted' },
            { position: 6, lineType: 'dotted' },
          ],
        }),
      );

      expect(getLocalSeriesStyles('group1', 'individual1', 'evaluation1').phase_changes).toEqual([
        { position: 3.5, lineType: 'dashed' },
        { position: 6, lineType: 'dotted' },
      ]);
    });
  });

  describe('show title', () => {
    it('defaults to shown when nothing is saved', () => {
      expect(getLocalShowTitle(group, individual, evaluation, 'Rate')).toBe(true);
    });

    it('round-trips a hidden title per plot type', () => {
      setLocalShowTitle(group, individual, evaluation, 'Rate', false);

      expect(getLocalShowTitle(group, individual, evaluation, 'Rate')).toBe(false);
      expect(getLocalShowTitle(group, individual, evaluation, 'Proportion')).toBe(true);
    });

    it('restores a shown title after it was hidden', () => {
      setLocalShowTitle(group, individual, evaluation, 'Proportion', false);
      setLocalShowTitle(group, individual, evaluation, 'Proportion', true);

      expect(getLocalShowTitle(group, individual, evaluation, 'Proportion')).toBe(true);
    });
  });

  describe('tooltip and condition legend', () => {
    it('defaults both to shown when nothing is saved', () => {
      expect(getLocalShowTooltip(group, individual, evaluation)).toBe(true);
      expect(getLocalShowConditionLegend(group, individual, evaluation)).toBe(true);
    });

    it('round-trips hidden values and restores them when turned back on', () => {
      setLocalShowTooltip(group, individual, evaluation, false);
      setLocalShowConditionLegend(group, individual, evaluation, false);

      expect(getLocalShowTooltip(group, individual, evaluation)).toBe(false);
      expect(getLocalShowConditionLegend(group, individual, evaluation)).toBe(false);

      setLocalShowTooltip(group, individual, evaluation, true);
      setLocalShowConditionLegend(group, individual, evaluation, true);

      expect(getLocalShowTooltip(group, individual, evaluation)).toBe(true);
      expect(getLocalShowConditionLegend(group, individual, evaluation)).toBe(true);
    });
  });

  describe('show description', () => {
    it('defaults to shown and round-trips hidden and shown values', () => {
      expect(getLocalShowDescription(group, individual, evaluation)).toBe(true);

      setLocalShowDescription(group, individual, evaluation, false);
      expect(getLocalShowDescription(group, individual, evaluation)).toBe(false);

      setLocalShowDescription(group, individual, evaluation, true);
      expect(getLocalShowDescription(group, individual, evaluation)).toBe(true);
    });
  });

  describe('connect spans', () => {
    it('defaults to not connected when nothing is saved', () => {
      expect(getLocalConnectSpans(group, individual, evaluation, 'Rate')).toBe(false);
    });

    it('round-trips a connected state per plot type', () => {
      setLocalConnectSpans(group, individual, evaluation, 'Rate', true);

      expect(getLocalConnectSpans(group, individual, evaluation, 'Rate')).toBe(true);
      expect(getLocalConnectSpans(group, individual, evaluation, 'Proportion')).toBe(false);
    });

    it('restores a disconnected state after it was connected', () => {
      setLocalConnectSpans(group, individual, evaluation, 'Proportion', true);
      setLocalConnectSpans(group, individual, evaluation, 'Proportion', false);

      expect(getLocalConnectSpans(group, individual, evaluation, 'Proportion')).toBe(false);
    });
  });

  describe('figure labels', () => {
    const saved = {
      overrideTitle: true,
      titleText: 'Custom',
      overrideXAxis: false,
      xAxisText: '',
      overrideYAxis: true,
      yAxisText: 'Rate',
    };

    it('defaults to no overrides when nothing is saved', () => {
      expect(getLocalFigureLabels(group, individual, evaluation, 'Rate')).toEqual(EMPTY_FIGURE_LABEL_SETTINGS);
    });

    it('round-trips label settings per plot type', () => {
      setLocalFigureLabels(group, individual, evaluation, 'Rate', saved);

      expect(getLocalFigureLabels(group, individual, evaluation, 'Rate')).toEqual(saved);
      expect(getLocalFigureLabels(group, individual, evaluation, 'Proportion')).toEqual(EMPTY_FIGURE_LABEL_SETTINGS);
    });

    it('falls back to empty settings when stored JSON is invalid', () => {
      localStorage.setItem(`${group}_${individual}_${evaluation}_FigureLabels_Rate`, '{not json');

      expect(getLocalFigureLabels(group, individual, evaluation, 'Rate')).toEqual(EMPTY_FIGURE_LABEL_SETTINGS);
    });

    it('falls back to empty settings when stored data has the wrong shape', () => {
      localStorage.setItem(
        `${group}_${individual}_${evaluation}_FigureLabels_Rate`,
        JSON.stringify({ overrideTitle: true }),
      );

      expect(getLocalFigureLabels(group, individual, evaluation, 'Rate')).toEqual(EMPTY_FIGURE_LABEL_SETTINGS);
    });
  });

  describe('legend settings', () => {
    const saved = { position: 'upper-left' as const, layout: 'vertical' as const };

    it('defaults to below and horizontal when nothing is saved', () => {
      expect(getLocalLegendSettings(group, individual, evaluation, 'Rate')).toEqual(DEFAULT_LEGEND_SETTINGS);
    });

    it('round-trips legend settings per plot type', () => {
      setLocalLegendSettings(group, individual, evaluation, 'Rate', saved);

      expect(getLocalLegendSettings(group, individual, evaluation, 'Rate')).toEqual(saved);
      expect(getLocalLegendSettings(group, individual, evaluation, 'Proportion')).toEqual(DEFAULT_LEGEND_SETTINGS);
    });

    it('falls back to defaults when stored JSON is invalid', () => {
      localStorage.setItem(`${group}_${individual}_${evaluation}_LegendSettings_Rate`, '{not json');

      expect(getLocalLegendSettings(group, individual, evaluation, 'Rate')).toEqual(DEFAULT_LEGEND_SETTINGS);
    });

    it('falls back to defaults when stored data has an unknown position', () => {
      localStorage.setItem(
        `${group}_${individual}_${evaluation}_LegendSettings_Rate`,
        JSON.stringify({ position: 'center', layout: 'vertical' }),
      );

      expect(getLocalLegendSettings(group, individual, evaluation, 'Rate')).toEqual(DEFAULT_LEGEND_SETTINGS);
    });
  });
});
