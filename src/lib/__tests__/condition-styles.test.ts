import { describe, it, expect, beforeEach } from 'vitest';
import {
  renameConditionInList,
  renameConditionInSeriesStyles,
  renameConditionsInLocalStorage,
  syncConditionRenameStyles,
} from '../condition-styles';
import {
  getLocalHiddenConditions,
  getLocalSeriesStyles,
  setLocalHiddenConditions,
  setLocalSeriesStyles,
} from '../local_storage';
import { saveStylesBackup } from '../styles-file';
import type { SeriesStyles } from '../graphing/series-style';
import type { ModifiedSessionResult } from '@/types/storage';

const styles = (overrides: Partial<SeriesStyles> = {}): SeriesStyles => ({
  KeyStyles: {},
  ConditionStyles: {},
  phase_changes: [],
  text_annotations: [],
  aim_lines: [],
  ...overrides,
});

const session = (Filename: string, Condition: string) =>
  ({ Filename, SessionSettings: { Condition } }) as ModifiedSessionResult;

describe('renameConditionInSeriesStyles', () => {
  it('moves the condition color and every per-key entry to the new name', () => {
    const result = renameConditionInSeriesStyles(
      styles({
        ConditionStyles: { Baseline: { color: '#111111' } },
        KeyStyles: {
          SIB: {
            shape: 'circle',
            shapes: { Baseline: 'square' },
            fillColors: { Baseline: '#222222' },
            lineColors: { Baseline: '#333333' },
          },
        },
      }),
      'Baseline',
      'BL',
      false,
    );

    expect(result.ConditionStyles).toEqual({ BL: { color: '#111111' } });
    expect(result.KeyStyles.SIB).toEqual({
      shape: 'circle',
      shapes: { BL: 'square' },
      fillColors: { BL: '#222222' },
      lineColors: { BL: '#333333' },
    });
  });

  it('leaves other conditions, keys without entries, and the other series fields alone', () => {
    const input = styles({
      ConditionStyles: { Other: { color: '#abcdef' } },
      KeyStyles: { AGG: { shape: 'diamond' }, SIB: { shapes: { Other: 'square' } } },
      phase_changes: [{ position: 3, lineType: 'solid' }],
    });

    const result = renameConditionInSeriesStyles(input, 'Baseline', 'BL', false);

    expect(result).toEqual(input);
    expect(result.KeyStyles.AGG).toBe(input.KeyStyles.AGG);
  });

  it('keeps the existing target styles when the target condition already existed', () => {
    const result = renameConditionInSeriesStyles(
      styles({
        ConditionStyles: { Baseline: { color: '#111111' }, BL: { color: '#999999' } },
        KeyStyles: { SIB: { fillColors: { Baseline: '#222222', BL: '#888888' } } },
      }),
      'Baseline',
      'BL',
      true,
    );

    expect(result.ConditionStyles).toEqual({ BL: { color: '#999999' } });
    expect(result.KeyStyles.SIB.fillColors).toEqual({ BL: '#888888' });
  });

  it('adopts the source styles over leftovers when the target is a new condition', () => {
    const result = renameConditionInSeriesStyles(
      styles({ ConditionStyles: { Baseline: { color: '#111111' }, BL: { color: '#999999' } } }),
      'Baseline',
      'BL',
      false,
    );

    expect(result.ConditionStyles).toEqual({ BL: { color: '#111111' } });
  });

  it('adopts source styles when the target existed but has none of its own', () => {
    const result = renameConditionInSeriesStyles(
      styles({ ConditionStyles: { Baseline: { color: '#111111' } } }),
      'Baseline',
      'BL',
      true,
    );

    expect(result.ConditionStyles).toEqual({ BL: { color: '#111111' } });
  });

  it('does nothing when the names match', () => {
    const input = styles({ ConditionStyles: { Baseline: { color: '#111111' } } });

    expect(renameConditionInSeriesStyles(input, 'Baseline', 'Baseline', false)).toBe(input);
  });
});

describe('renameConditionInList', () => {
  it('renames a hidden condition', () => {
    expect(renameConditionInList(['Baseline', 'Tx'], 'Baseline', 'BL', false)).toEqual(['Tx', 'BL']);
  });

  it('returns the same list when the source is not hidden', () => {
    const list = ['Tx'];

    expect(renameConditionInList(list, 'Baseline', 'BL', false)).toBe(list);
  });

  it('keeps the target visibility when the target already existed', () => {
    expect(renameConditionInList(['Baseline'], 'Baseline', 'BL', true)).toEqual([]);
    expect(renameConditionInList(['Baseline', 'BL'], 'Baseline', 'BL', true)).toEqual(['BL']);
  });

  it('does not duplicate a target that is already hidden', () => {
    expect(renameConditionInList(['Baseline', 'BL'], 'Baseline', 'BL', false)).toEqual(['BL']);
  });
});

describe('renameConditionsInLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('updates stored series styles and hidden conditions', () => {
    setLocalSeriesStyles('G', 'I', 'E', styles({ ConditionStyles: { Baseline: { color: '#111111' } } }));
    setLocalHiddenConditions('G', 'I', 'E', ['Baseline']);

    renameConditionsInLocalStorage('G', 'I', 'E', ['Baseline'], 'BL', false);

    expect(getLocalSeriesStyles('G', 'I', 'E').ConditionStyles).toEqual({ BL: { color: '#111111' } });
    expect(getLocalHiddenConditions('G', 'I', 'E')).toEqual(['BL']);
  });

  it('writes nothing when no stored style mentions the condition', () => {
    renameConditionsInLocalStorage('G', 'I', 'E', ['Baseline'], 'BL', false);

    expect(Object.keys(localStorage)).toEqual([]);
  });

  it('uses the first source that has styles when several conditions merge into a new one', () => {
    setLocalSeriesStyles(
      'G',
      'I',
      'E',
      styles({ ConditionStyles: { B: { color: '#222222' }, C: { color: '#333333' } } }),
    );

    renameConditionsInLocalStorage('G', 'I', 'E', ['A', 'B', 'C'], 'T', false);

    expect(getLocalSeriesStyles('G', 'I', 'E').ConditionStyles).toEqual({ T: { color: '#222222' } });
  });

  it('carries the rename into the undo snapshot of a styles read', () => {
    setLocalSeriesStyles('G', 'I', 'E', styles({ ConditionStyles: { Baseline: { color: '#111111' } } }));
    setLocalHiddenConditions('G', 'I', 'E', ['Baseline']);
    saveStylesBackup('G', 'I', 'E');

    renameConditionsInLocalStorage('G', 'I', 'E', ['Baseline'], 'BL', false);

    const snapshot = JSON.parse(sessionStorage.getItem('styles-backup:G|I|E')!);
    expect(snapshot.seriesStyles.ConditionStyles).toEqual({ BL: { color: '#111111' } });
    expect(snapshot.hiddenConditions).toEqual(['BL']);
    expect(snapshot.showTooltip).toBe(true);
  });

  it('leaves an unreadable undo snapshot alone', () => {
    sessionStorage.setItem('styles-backup:G|I|E', '{not json');

    renameConditionsInLocalStorage('G', 'I', 'E', ['Baseline'], 'BL', false);

    expect(sessionStorage.getItem('styles-backup:G|I|E')).toBe('{not json');
  });
});

describe('syncConditionRenameStyles', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setLocalSeriesStyles(
      'G',
      'I',
      'E',
      styles({ ConditionStyles: { Baseline: { color: '#111111' }, Tx: { color: '#999999' } } }),
    );
  });

  const all = [session('a', 'Baseline'), session('b', 'Baseline'), session('c', 'Tx')];

  it('moves the styles when every session of the condition is renamed', () => {
    syncConditionRenameStyles('G', 'I', 'E', [all[0], all[1]], all, ' BL ');

    expect(getLocalSeriesStyles('G', 'I', 'E').ConditionStyles).toEqual({
      BL: { color: '#111111' },
      Tx: { color: '#999999' },
    });
  });

  it('keeps the styles in place when some sessions of the condition remain', () => {
    syncConditionRenameStyles('G', 'I', 'E', [all[0]], all, 'BL');

    expect(getLocalSeriesStyles('G', 'I', 'E').ConditionStyles).toEqual({
      Baseline: { color: '#111111' },
      Tx: { color: '#999999' },
    });
  });

  it('keeps the existing styles of a target condition that already has sessions', () => {
    syncConditionRenameStyles('G', 'I', 'E', [all[0], all[1]], all, 'Tx');

    expect(getLocalSeriesStyles('G', 'I', 'E').ConditionStyles).toEqual({ Tx: { color: '#999999' } });
  });

  it('does nothing when sessions are renamed to their own condition', () => {
    syncConditionRenameStyles('G', 'I', 'E', [all[0], all[1]], all, 'Baseline');

    expect(getLocalSeriesStyles('G', 'I', 'E').ConditionStyles).toEqual({
      Baseline: { color: '#111111' },
      Tx: { color: '#999999' },
    });
  });

  it('moves each emptied condition when sessions from several conditions are selected', () => {
    syncConditionRenameStyles('G', 'I', 'E', all, all, 'Merged');

    expect(getLocalSeriesStyles('G', 'I', 'E').ConditionStyles).toEqual({ Merged: { color: '#111111' } });
  });
});
