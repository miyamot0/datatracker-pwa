import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SavedSessionResult } from '../../dtos';
import { KeySet, KeySetInstance } from '@/types/keyset/core';
import { ExpandedKeySetInstance } from '@/types/keyset/display';
import { TRANSPARENT_COLOR } from '@/lib/graphing/series-style';
import { getShape } from '@/lib/shapes';

vi.mock('@/lib/colors', () => ({
  FIGURE_PATH_COLORS: ['#9061C2', '#4E9CB5', '#4BC599', '#F9A826', '#EB540A', '#C86F98', '#14B694'],
}));

vi.mock('@/lib/shapes', () => ({
  getShape: vi.fn((index) => {
    const shapes = ['circle', 'cross', 'diamond', 'square', 'star', 'triangle', 'wye'];
    return shapes[index % 7];
  }),
}));

import {
  generateTicks,
  createChartLegends,
  getChartConfiguration,
  getChartVerticalSpacing,
  createNavigationHandler,
} from '@/lib/graphing/chart-setup';

const createMockKeySet = (frequencyKeys: KeySetInstance[] = [], durationKeys: KeySetInstance[] = []): KeySet => ({
  id: 'test-keyset-1',
  Name: 'Test KeySet',
  DerivedKeys: [],
  FrequencyKeys: frequencyKeys,
  DurationKeys: durationKeys,
  createdAt: new Date('2024-01-01'),
  lastModified: new Date('2024-01-01'),
  SpecialDurationKeys: [],
  ScorableDurationKeys: [],
});

const createMockSession = (
  session: number,
  condition: string = 'Baseline',
  keyset: KeySet = createMockKeySet(),
): SavedSessionResult => ({
  Keyset: keyset,
  SessionSettings: {
    Therapist: 'Test Therapist',
    Condition: condition,
    KeySet: 'test-keyset',
    TimerOption: 'End on Timer #1',
    Initials: 'TT',
    Role: 'Primary',
    Session: session,
    DurationS: 600,
  },
  SystemKeyPresses: [],
  FrequencyKeyPresses: [],
  DurationKeyPresses: [],
  SessionStart: '2024-01-01T10:00:00Z',
  SessionEnd: '2024-01-01T10:10:00Z',
  EndedEarly: false,
  TimerMain: 600,
  TimerOne: 300,
  TimerTwo: 450,
  TimerThree: 500,
  SpecialKeyTimers: {},
});

describe('chart-setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateTicks', () => {
    it('should generate an inclusive tick array from minTick to maxTick', () => {
      expect(generateTicks(5, 1)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should generate correct tick array starting from 0', () => {
      expect(generateTicks(3, 0)).toEqual([0, 1, 2, 3]);
    });

    it('should handle single tick', () => {
      expect(generateTicks(5, 5)).toEqual([5]);
    });

    it('should handle negative starting values', () => {
      expect(generateTicks(2, -2)).toEqual([-2, -1, 0, 1, 2]);
    });

    it('should return an empty array when maxTick is below minTick', () => {
      expect(generateTicks(2, 98)).toEqual([]);
    });

    it('should handle large ranges', () => {
      expect(generateTicks(100, 98)).toEqual([98, 99, 100]);
    });
  });

  describe('createChartLegends', () => {
    it('should create legends for conditions and visible keys', () => {
      const filteredSessions = [
        createMockSession(1, 'Baseline'),
        createMockSession(2, 'Treatment'),
        createMockSession(3, 'Baseline'),
        createMockSession(4, 'Maintenance'),
      ];

      const keySetFull: ExpandedKeySetInstance[] = [
        { KeyDescription: 'Key1', Visible: true },
        { KeyDescription: 'Key2', Visible: false },
        { KeyDescription: 'Key3', Visible: true },
      ];

      const result = createChartLegends(filteredSessions, keySetFull);

      // 3 condition legends + 2 visible key legends
      expect(result).toHaveLength(5);

      expect(result[0]).toEqual({
        id: 'Baseline',
        kind: 'condition',
        type: 'circle',
        value: 'Baseline',
        color: '#9061C2',
      });
      expect(result[1]).toEqual({
        id: 'Treatment',
        kind: 'condition',
        type: 'circle',
        value: 'Treatment',
        color: '#4E9CB5',
      });
      expect(result[2]).toEqual({
        id: 'Maintenance',
        kind: 'condition',
        type: 'circle',
        value: 'Maintenance',
        color: '#4BC599',
      });

      expect(result[3]).toEqual({
        id: 'Key1',
        type: 'circle',
        value: 'Key1',
        color: 'black',
      });
      expect(result[4]).toEqual({
        id: 'Key3',
        type: 'cross',
        value: 'Key3',
        color: 'black',
      });

      expect(getShape).toHaveBeenCalledWith(0);
      expect(getShape).toHaveBeenCalledWith(1);
      expect(getShape).toHaveBeenCalledTimes(2);
    });

    it('should handle empty filtered sessions', () => {
      const keySetFull: ExpandedKeySetInstance[] = [{ KeyDescription: 'Key1', Visible: true }];

      const result = createChartLegends([], keySetFull);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'Key1',
        type: 'circle',
        value: 'Key1',
        color: 'black',
      });
    });

    it('should handle empty keyset', () => {
      const result = createChartLegends([createMockSession(1, 'Baseline')], []);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'Baseline',
        kind: 'condition',
        type: 'circle',
        value: 'Baseline',
        color: '#9061C2',
      });
    });

    it('should filter out invisible keys', () => {
      const keySetFull: ExpandedKeySetInstance[] = [
        { KeyDescription: 'Key1', Visible: false },
        { KeyDescription: 'Key2', Visible: false },
      ];

      const result = createChartLegends([createMockSession(1, 'Baseline')], keySetFull);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'Baseline',
        kind: 'condition',
        type: 'circle',
        value: 'Baseline',
        color: '#9061C2',
      });
    });

    it('should default key shapes by visible position, so hidden keys do not shift the sequence', () => {
      const keySetFull: ExpandedKeySetInstance[] = [
        { KeyDescription: 'Hidden', Visible: false },
        { KeyDescription: 'Shown', Visible: true },
      ];

      const result = createChartLegends([], keySetFull);

      expect(result[0]).toMatchObject({ value: 'Shown', type: 'circle' });
      expect(getShape).toHaveBeenCalledWith(0);
      expect(getShape).not.toHaveBeenCalledWith(1);
    });

    it('should wrap condition colours around the palette when there are more conditions than colours', () => {
      const conditions = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'];
      const filteredSessions = conditions.map((condition, index) => createMockSession(index + 1, condition));

      const result = createChartLegends(filteredSessions, []);

      expect(result).toHaveLength(8);
      expect(result[7]).toMatchObject({ value: 'C8', color: '#9061C2' });
    });

    describe('with saved series styles', () => {
      const filteredSessions = [
        createMockSession(1, 'Baseline'),
        createMockSession(2, 'Treatment'),
        createMockSession(3, 'Maintenance'),
      ];

      const keySetFull: ExpandedKeySetInstance[] = [
        { KeyDescription: 'Key1', Visible: true },
        { KeyDescription: 'Key2', Visible: false },
        { KeyDescription: 'Key3', Visible: true },
      ];

      it('uses a saved condition fill and keeps defaults for unstyled conditions', () => {
        const result = createChartLegends(filteredSessions, keySetFull, {
          KeyStyles: {},
          ConditionStyles: { Treatment: { color: '#FF0000' } },
        });

        const fills = result.filter((entry) => entry.kind === 'condition').map((entry) => entry.color);
        expect(fills).toEqual(['#9061C2', '#FF0000', '#4BC599']);
      });

      it('keeps a transparent condition fill as transparent', () => {
        const result = createChartLegends(filteredSessions, keySetFull, {
          KeyStyles: {},
          ConditionStyles: { Baseline: { color: TRANSPARENT_COLOR } },
        });

        expect(result[0]).toMatchObject({ value: 'Baseline', color: 'transparent' });
      });

      it('applies a saved key shape to the matching visible key only', () => {
        const result = createChartLegends(filteredSessions, keySetFull, {
          KeyStyles: { Key3: { shape: 'star' } },
          ConditionStyles: {},
        });

        const keys = result.filter((entry) => entry.kind !== 'condition');
        expect(keys.map((entry) => [entry.value, entry.type])).toEqual([
          ['Key1', 'circle'],
          ['Key3', 'star'],
        ]);
      });

      it('keeps key legend fills black even when condition styles are saved', () => {
        const result = createChartLegends(filteredSessions, keySetFull, {
          KeyStyles: {},
          ConditionStyles: { Treatment: { color: '#FF0000' } },
        });

        const keys = result.filter((entry) => entry.kind !== 'condition');
        expect(keys.every((entry) => entry.color === 'black')).toBe(true);
      });
    });
  });

  describe('getChartVerticalSpacing', () => {
    it('pins the base row values', () => {
      expect(getChartVerticalSpacing('base')).toEqual({
        titleFontPx: 24,
        titleY: 25,
        chartMarginTop: 62,
        chartHeight: 522,
        xAxisHeight: 60,
        xAxisLabelOffset: 0,
      });
    });

    it('grows title, top margin, and x-axis band as text size increases', () => {
      const sizes = ['base', 'large', 'extraLarge'] as const;
      const rows = sizes.map((size) => getChartVerticalSpacing(size));
      for (const key of ['titleFontPx', 'titleY', 'chartMarginTop', 'chartHeight', 'xAxisHeight'] as const) {
        for (let i = 1; i < rows.length; i++) {
          expect(rows[i][key]).toBeGreaterThan(rows[i - 1][key]);
        }
      }
    });

    it('keeps the title baseline inside the reserved top margin', () => {
      for (const size of ['base', 'large', 'extraLarge'] as const) {
        const { titleY, titleFontPx, chartMarginTop } = getChartVerticalSpacing(size);
        expect(titleY + titleFontPx / 2).toBeLessThan(chartMarginTop);
      }
    });

    it('shrinks the top margin when the title is hidden and keeps the chart height', () => {
      for (const size of ['base', 'large', 'extraLarge'] as const) {
        const shown = getChartVerticalSpacing(size);
        const hidden = getChartVerticalSpacing(size, false);
        expect(hidden.chartMarginTop).toBeLessThan(shown.chartMarginTop);
        expect(hidden.chartHeight).toBe(shown.chartHeight);
        expect(hidden.xAxisHeight).toBe(shown.xAxisHeight);
      }
    });

    it('returns a copy so callers cannot mutate the table', () => {
      const first = getChartVerticalSpacing('base');
      first.chartHeight = 1;
      expect(getChartVerticalSpacing('base').chartHeight).toBe(522);
    });
  });

  describe('getChartConfiguration', () => {
    it('should return consistent chart configuration object', () => {
      expect(getChartConfiguration()).toEqual({
        noAnimationProps: {
          isAnimationActive: false,
          animationDuration: 0,
        },
        chartMargins: {
          top: 50,
          right: 10,
          left: 10,
          bottom: 10,
        },
        xAxisConfig: {
          height: 50,
          interval: 'preserveStartEnd',
          minTickGap: 25,
          type: 'number',
          dy: 5,
          padding: {
            left: 25,
            right: 25,
          },
          style: {
            stroke: 'black',
            strokeWidth: 1,
          },
        },
        yAxisConfig: {
          width: 50,
          padding: {
            left: 50,
            right: 50,
          },
          style: {
            stroke: 'black',
            strokeWidth: 1,
          },
        },
        yAxisStyle: {
          stroke: 'black',
          strokeWidth: 1,
        },
        labelStyle: {
          textAnchor: 'middle',
          fill: 'black',
          fontWeight: 'bold',
        },
      });
    });

    it('should return same configuration on multiple calls', () => {
      expect(getChartConfiguration()).toEqual(getChartConfiguration());
    });
  });

  describe('createNavigationHandler', () => {
    it('should create navigation handler that calls navigate with correct parameters', () => {
      const mockNavigate = vi.fn();

      const handler = createNavigationHandler(mockNavigate, 'testGroup', 'testIndividual', 'testEvaluation');
      handler({ session: 5, Condition: 'Baseline' });

      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/session/$group/$individual/$evaluation/history/view/$file',
        params: {
          group: 'testGroup',
          individual: 'testIndividual',
          evaluation: 'testEvaluation',
          file: '5_Baseline_Primary',
        },
      });
    });

    it('should handle different session numbers and conditions', () => {
      const mockNavigate = vi.fn();
      const handler = createNavigationHandler(mockNavigate, 'group1', 'individual1', 'eval1');
      handler({ session: 10, Condition: 'Treatment' });

      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/session/$group/$individual/$evaluation/history/view/$file',
        params: {
          group: 'group1',
          individual: 'individual1',
          evaluation: 'eval1',
          file: '10_Treatment_Primary',
        },
      });
    });
  });
});
