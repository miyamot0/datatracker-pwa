import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_LINE_COLOR,
  EMPTY_SERIES_STYLES,
  MARKER_BORDER_COLOR,
  TRANSPARENT_COLOR,
  resolveFillColor,
  resolveKeyFillColor,
  resolveKeyShape,
  resolveLineColor,
  resolveMarkerStroke,
  isSeriesHidden,
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
};

describe('series style resolvers fall back to defaults', () => {
  it('returns the default shape when no style is saved or the saved shape is invalid', () => {
    expect(resolveKeyShape(EMPTY_SERIES_STYLES, 'Hitting', 'circle')).toBe('circle');
    expect(
      resolveKeyShape(
        { KeyStyles: { Hitting: { shape: 'not-a-shape' as never } }, ConditionStyles: {} },
        'Hitting',
        'cross',
      ),
    ).toBe('cross');
    expect(resolveKeyShape(styled, 'Hitting', 'circle')).toBe('star');
  });

  it('always uses a black marker border', () => {
    expect(MARKER_BORDER_COLOR).toBe('black');
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
    };

    expect(isSeriesHidden(styles, 'Key1', 'Baseline')).toBe(true);
    expect(isSeriesHidden(styles, 'Key1', 'Treatment')).toBe(false);
  });

  it('is false when only the fill is transparent, since the line still draws', () => {
    const styles = {
      KeyStyles: { Key1: { fillColors: { Baseline: TRANSPARENT_COLOR } } },
      ConditionStyles: {},
    };

    expect(isSeriesHidden(styles, 'Key1', 'Baseline')).toBe(false);
  });

  it('is true when a transparent condition fill and a transparent line both apply', () => {
    const styles = {
      KeyStyles: { Key1: { lineColors: { Baseline: TRANSPARENT_COLOR } } },
      ConditionStyles: { Baseline: { color: TRANSPARENT_COLOR } },
    };

    expect(isSeriesHidden(styles, 'Key1', 'Baseline')).toBe(true);
  });
});
