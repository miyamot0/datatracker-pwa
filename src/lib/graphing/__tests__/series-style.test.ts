import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_LINE_COLOR,
  EMPTY_SERIES_STYLES,
  MARKER_BORDER_COLOR,
  TRANSPARENT_COLOR,
  resolveFillColor,
  resolveKeyFillColor,
  resolveKeyShape,
  resolveKeyConditionShape,
  resolveLineColor,
  resolveMarkerStroke,
  isSeriesHidden,
  isValidTextAnnotation,
  isValidPhaseChange,
  getPageTextAnnotations,
  isValidAimLine,
  getPageAimLines,
  splitTextAnnotationLines,
  SERIES_COLOR_PALETTE,
  type SeriesStyles,
} from '@/lib/graphing/series-style';
import { getLocalSeriesStyles, setLocalSeriesStyles } from '@/lib/local_storage';
import { FIGURE_PATH_COLORS } from '@/lib/colors';

const styled: SeriesStyles = {
  KeyStyles: {
    Hitting: { shape: 'star', lineColors: { Baseline: '#000000' } },
  },
  ConditionStyles: { Treatment: { color: '#FF0000' } },
  phase_changes: [{ position: 4, lineType: 'dashed' }],
  text_annotations: [],
  aim_lines: [],
};

describe('series style resolvers fall back to defaults', () => {
  it('returns the default shape when no style is saved or the saved shape is invalid', () => {
    expect(resolveKeyShape(EMPTY_SERIES_STYLES, 'Hitting', 'circle')).toBe('circle');
    expect(
      resolveKeyShape(
        {
          KeyStyles: { Hitting: { shape: 'not-a-shape' as never } },
          ConditionStyles: {},
          phase_changes: [],
          text_annotations: [],
          aim_lines: [],
        },
        'Hitting',
        'cross',
      ),
    ).toBe('cross');
    expect(resolveKeyShape(styled, 'Hitting', 'circle')).toBe('star');
  });

  it('always uses a black marker border', () => {
    expect(MARKER_BORDER_COLOR).toBe('black');
  });

  it('prefers a key x condition shape, then the key shape, then the default', () => {
    const withCondition: SeriesStyles = {
      ...styled,
      KeyStyles: { Hitting: { shape: 'star', shapes: { Treatment: 'diamond', Baseline: 'not-a-shape' as never } } },
    };

    expect(resolveKeyConditionShape(withCondition, 'Hitting', 'Treatment', 'circle')).toBe('diamond');
    expect(resolveKeyConditionShape(withCondition, 'Hitting', 'Baseline', 'circle')).toBe('star');
    expect(resolveKeyConditionShape(withCondition, 'Missing', 'Treatment', 'circle')).toBe('circle');
  });

  it('hides the whole marker when its fill is transparent', () => {
    expect(resolveMarkerStroke(TRANSPARENT_COLOR)).toBe(TRANSPARENT_COLOR);
    expect(resolveMarkerStroke('#FF0000')).toBe(MARKER_BORDER_COLOR);
    expect(
      resolveKeyFillColor(
        { ...styled, KeyStyles: { Hitting: { fillColors: { Baseline: TRANSPARENT_COLOR } } } },
        'Hitting',
        'Baseline',
        '#9061C2',
      ),
    ).toBe(TRANSPARENT_COLOR);
  });

  it('uses the condition colour for fill and falls back to the default', () => {
    expect(resolveFillColor(EMPTY_SERIES_STYLES, 'Baseline', FIGURE_PATH_COLORS[0])).toBe(FIGURE_PATH_COLORS[0]);
    expect(resolveFillColor(styled, 'Treatment', FIGURE_PATH_COLORS[0])).toBe('#FF0000');
  });

  it('prefers key by condition fill, then condition colour, then default', () => {
    const withFill: SeriesStyles = {
      KeyStyles: { Hitting: { fillColors: { Baseline: '#00FF00' } } },
      ConditionStyles: { Baseline: { color: '#FF0000' } },
      phase_changes: [],
      text_annotations: [],
      aim_lines: [],
    };

    expect(resolveKeyFillColor(withFill, 'Hitting', 'Baseline', '#9061C2')).toBe('#00FF00');
    expect(resolveKeyFillColor(withFill, 'Kicking', 'Baseline', '#9061C2')).toBe('#FF0000');
    expect(resolveKeyFillColor(EMPTY_SERIES_STYLES, 'Kicking', 'Baseline', '#9061C2')).toBe('#9061C2');
  });

  it('uses the key by condition line colour, otherwise the default (never the condition fill)', () => {
    expect(resolveLineColor(EMPTY_SERIES_STYLES, 'Hitting', 'Baseline', DEFAULT_LINE_COLOR)).toBe('black');
    expect(resolveLineColor(styled, 'Hitting', 'Treatment', DEFAULT_LINE_COLOR)).toBe('black');
    expect(resolveLineColor(styled, 'Hitting', 'Baseline', DEFAULT_LINE_COLOR)).toBe('#000000');
    expect(resolveLineColor(styled, 'Kicking', 'Baseline', DEFAULT_LINE_COLOR)).toBe('black');
  });

  it('offers the figure palette plus black and white', () => {
    expect(SERIES_COLOR_PALETTE).toEqual([...FIGURE_PATH_COLORS, '#000000', '#FFFFFF']);
  });
});

describe('series style storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty styles when nothing has been saved', () => {
    expect(getLocalSeriesStyles('G', 'I', 'E')).toEqual(EMPTY_SERIES_STYLES);
  });

  it('round-trips saved styles for the same group, individual, and evaluation only', () => {
    setLocalSeriesStyles('G', 'I', 'E', styled);

    expect(getLocalSeriesStyles('G', 'I', 'E')).toEqual(styled);
    expect(getLocalSeriesStyles('G', 'I', 'Other')).toEqual(EMPTY_SERIES_STYLES);
  });
});

describe('isSeriesHidden', () => {
  it('is false with no saved styles', () => {
    expect(isSeriesHidden(EMPTY_SERIES_STYLES, 'Key1', 'Baseline')).toBe(false);
  });

  it('is true when both the line and the marker fill are transparent for the condition', () => {
    const styles = {
      KeyStyles: {
        Key1: {
          fillColors: { Baseline: TRANSPARENT_COLOR },
          lineColors: { Baseline: TRANSPARENT_COLOR },
        },
      },
      ConditionStyles: {},
      phase_changes: [],
      text_annotations: [],
      aim_lines: [],
    };

    expect(isSeriesHidden(styles, 'Key1', 'Baseline')).toBe(true);
    expect(isSeriesHidden(styles, 'Key1', 'Treatment')).toBe(false);
  });

  it('is false when only the fill is transparent, since the line still draws', () => {
    const styles = {
      KeyStyles: { Key1: { fillColors: { Baseline: TRANSPARENT_COLOR } } },
      ConditionStyles: {},
      phase_changes: [],
      text_annotations: [],
      aim_lines: [],
    };

    expect(isSeriesHidden(styles, 'Key1', 'Baseline')).toBe(false);
  });

  it('is true when a transparent condition fill and a transparent line both apply', () => {
    const styles: SeriesStyles = {
      KeyStyles: { Key1: { lineColors: { Baseline: TRANSPARENT_COLOR } } },
      ConditionStyles: { Baseline: { color: TRANSPARENT_COLOR } },
      phase_changes: [],
      text_annotations: [],
      aim_lines: [],
    };

    expect(isSeriesHidden(styles, 'Key1', 'Baseline')).toBe(true);
  });
});

describe('aim line helpers', () => {
  const valid = { x1: 1, x2: 5, y: 40, lineType: 'dashed', color: '#9061C2' } as const;

  it('accepts a complete aim line and rejects incomplete or unknown values', () => {
    expect(isValidAimLine(valid)).toBe(true);
    expect(isValidAimLine(null)).toBe(false);
    expect(isValidAimLine({ ...valid, x1: Number.NaN })).toBe(false);
    expect(isValidAimLine({ ...valid, x2: '5' })).toBe(false);
    expect(isValidAimLine({ ...valid, y: Number.POSITIVE_INFINITY })).toBe(false);
    expect(isValidAimLine({ ...valid, lineType: 'wavy' })).toBe(false);
    expect(isValidAimLine({ ...valid, color: '   ' })).toBe(false);
    expect(isValidAimLine({ ...valid, page: 'rate' })).toBe(true);
    expect(isValidAimLine({ ...valid, page: 'phase' })).toBe(false);
  });

  it('returns only the aim lines for a page, including ones saved before pages existed', () => {
    const legacy = { x1: 1, x2: 5, y: 40, lineType: 'solid', color: '#000000' } as const;
    const rate = { ...legacy, y: 10, page: 'rate' } as const;
    const proportion = { ...legacy, y: 0.5, page: 'proportion' } as const;
    const all = [rate, proportion, legacy];

    expect(getPageAimLines(all, 'rate')).toEqual([rate, legacy]);
    expect(getPageAimLines(all, 'proportion')).toEqual([proportion, legacy]);
  });

  it('returns no aim lines when none are saved', () => {
    expect(getPageAimLines(undefined, 'rate')).toEqual([]);
  });
});

describe('phase change helpers', () => {
  it('accepts a positive finite position with a known line type', () => {
    expect(isValidPhaseChange({ position: 2, lineType: 'dashed' })).toBe(true);
  });

  it('rejects non-object values', () => {
    expect(isValidPhaseChange(null)).toBe(false);
    expect(isValidPhaseChange(undefined)).toBe(false);
    expect(isValidPhaseChange('phase')).toBe(false);
    expect(isValidPhaseChange(3)).toBe(false);
  });

  it('rejects non-positive, non-finite, or unknown values', () => {
    expect(isValidPhaseChange({ position: 0, lineType: 'solid' })).toBe(false);
    expect(isValidPhaseChange({ position: Number.NaN, lineType: 'solid' })).toBe(false);
    expect(isValidPhaseChange({ position: Number.POSITIVE_INFINITY, lineType: 'solid' })).toBe(false);
    expect(isValidPhaseChange({ position: 2, lineType: 'wavy' })).toBe(false);
  });
});

describe('text annotation helpers', () => {
  it('rejects non-object values', () => {
    expect(isValidTextAnnotation(null)).toBe(false);
    expect(isValidTextAnnotation('note')).toBe(false);
  });

  it('accepts a complete annotation and rejects incomplete or unknown values', () => {
    const valid = { label: 'Note', x: 2, y: 50, anchor: 'top-left', justify: 'center' };

    expect(isValidTextAnnotation(valid)).toBe(true);
    expect(isValidTextAnnotation({ ...valid, label: '   ' })).toBe(false);
    expect(isValidTextAnnotation({ ...valid, label: '\\n' })).toBe(false);
    expect(isValidTextAnnotation({ ...valid, label: 'Top\\n' })).toBe(true);
    expect(isValidTextAnnotation({ ...valid, x: Number.NaN })).toBe(false);
    expect(isValidTextAnnotation({ ...valid, anchor: 'middle' })).toBe(false);
    expect(isValidTextAnnotation({ ...valid, justify: 'justify' })).toBe(false);
    expect(isValidTextAnnotation({ ...valid, weight: 'normal' })).toBe(true);
    expect(isValidTextAnnotation({ ...valid, weight: 'bold' })).toBe(true);
    expect(isValidTextAnnotation({ ...valid, weight: 'heavy' })).toBe(false);
    expect(isValidTextAnnotation({ ...valid, page: 'rate' })).toBe(true);
    expect(isValidTextAnnotation({ ...valid, page: 'proportion' })).toBe(true);
    expect(isValidTextAnnotation({ ...valid, page: 'phase' })).toBe(false);
  });

  it('returns only the text annotations for a page, including ones saved before pages existed', () => {
    const legacy = { label: 'Legacy', x: 1, y: 1, anchor: 'top-left', justify: 'left' } as const;
    const rate = { ...legacy, label: 'Rate', page: 'rate' } as const;
    const proportion = { ...legacy, label: 'Proportion', page: 'proportion' } as const;
    const all = [rate, proportion, legacy];

    expect(getPageTextAnnotations(all, 'rate')).toEqual([rate, legacy]);
    expect(getPageTextAnnotations(all, 'proportion')).toEqual([proportion, legacy]);
  });

  it('splits a label on the literal \\n sequence', () => {
    expect(splitTextAnnotationLines('One\\nTwo\\nThree')).toEqual(['One', 'Two', 'Three']);
    expect(splitTextAnnotationLines('Single')).toEqual(['Single']);
  });
});
