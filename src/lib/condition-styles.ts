import type { SeriesStyles } from '@/lib/graphing/series-style';
import {
  getLocalHiddenConditions,
  getLocalSeriesStyles,
  setLocalHiddenConditions,
  setLocalSeriesStyles,
} from '@/lib/local_storage';
import { backupKey } from '@/lib/styles-file';
import type { ModifiedSessionResult } from '@/types/storage';

type ConditionRecord = Record<string, unknown>;

/**
 * Moves one condition's entry in a record to a new name. When the target condition already existed its entry
 * wins and the source entry is dropped. Otherwise the source entry replaces anything left over under the new name.
 */
function moveRecordEntry<T extends ConditionRecord | undefined>(
  record: T,
  from: string,
  to: string,
  keepTarget: boolean,
): T {
  if (!record || !(from in record)) {
    return record;
  }

  const next = { ...record } as ConditionRecord;
  const value = next[from];
  delete next[from];

  if (!(keepTarget && to in next)) {
    next[to] = value;
  }

  return next as T;
}

/**
 * Renames a condition everywhere series styles are keyed by condition: the condition colors and the per-key shapes,
 * fills, and line colors. Entries that are not affected are returned as the same objects.
 */
export function renameConditionInSeriesStyles(
  styles: SeriesStyles,
  from: string,
  to: string,
  targetExisted: boolean,
): SeriesStyles {
  if (from === to) {
    return styles;
  }

  const KeyStyles = Object.fromEntries(
    Object.entries(styles.KeyStyles ?? {}).map(([key, style]) => {
      const shapes = moveRecordEntry(style.shapes, from, to, targetExisted);
      const fillColors = moveRecordEntry(style.fillColors, from, to, targetExisted);
      const lineColors = moveRecordEntry(style.lineColors, from, to, targetExisted);

      return [
        key,
        shapes === style.shapes && fillColors === style.fillColors && lineColors === style.lineColors
          ? style
          : {
              ...style,
              ...(shapes ? { shapes } : {}),
              ...(fillColors ? { fillColors } : {}),
              ...(lineColors ? { lineColors } : {}),
            },
      ];
    }),
  );

  return {
    ...styles,
    KeyStyles,
    ConditionStyles: moveRecordEntry(styles.ConditionStyles ?? {}, from, to, targetExisted),
  };
}

/**
 * Renames a condition in a list of condition names. A hidden source makes a new target hidden. When the target
 * condition already existed its own visibility is kept.
 */
export function renameConditionInList(list: string[], from: string, to: string, targetExisted: boolean): string[] {
  if (from === to || !list.includes(from)) {
    return list;
  }

  const withoutSource = list.filter((name) => name !== from);

  return targetExisted || withoutSource.includes(to) ? withoutSource : [...withoutSource, to];
}

/**
 * Carries the styles of conditions that were renamed in the browser's local storage, and in the undo snapshot of a
 * styles read. When several conditions move to one new name, the first one's styles are used for it.
 */
export function renameConditionsInLocalStorage(
  group: string,
  individual: string,
  evaluation: string,
  from: string[],
  to: string,
  targetExisted: boolean,
): void {
  const apply = (styles: SeriesStyles, hidden: string[]) => {
    let nextStyles = styles;
    let nextHidden = hidden;
    let stylesClaimed = targetExisted;
    let hiddenClaimed = targetExisted;

    for (const source of from) {
      const movedStyles = renameConditionInSeriesStyles(nextStyles, source, to, stylesClaimed);
      const movedHidden = renameConditionInList(nextHidden, source, to, hiddenClaimed);

      // A source that had nothing to hand over must not stop a later source from supplying the new name's styles
      stylesClaimed = stylesClaimed || JSON.stringify(movedStyles) !== JSON.stringify(nextStyles);
      hiddenClaimed = hiddenClaimed || movedHidden !== nextHidden;
      nextStyles = movedStyles;
      nextHidden = movedHidden;
    }

    return { styles: nextStyles, hidden: nextHidden };
  };

  const current = {
    styles: getLocalSeriesStyles(group, individual, evaluation),
    hidden: getLocalHiddenConditions(group, individual, evaluation),
  };
  const next = apply(current.styles, current.hidden);

  if (next.styles !== current.styles && JSON.stringify(next.styles) !== JSON.stringify(current.styles)) {
    setLocalSeriesStyles(group, individual, evaluation, next.styles);
  }

  if (next.hidden !== current.hidden) {
    setLocalHiddenConditions(group, individual, evaluation, next.hidden);
  }

  const backup = sessionStorage.getItem(backupKey(group, individual, evaluation));

  if (backup === null) {
    return;
  }

  try {
    const snapshot = JSON.parse(backup) as { seriesStyles?: SeriesStyles; hiddenConditions?: string[] };
    const moved = apply(
      snapshot.seriesStyles ?? ({ KeyStyles: {}, ConditionStyles: {} } as SeriesStyles),
      snapshot.hiddenConditions ?? [],
    );

    sessionStorage.setItem(
      backupKey(group, individual, evaluation),
      JSON.stringify({
        ...snapshot,
        ...(snapshot.seriesStyles ? { seriesStyles: moved.styles } : {}),
        ...(snapshot.hiddenConditions ? { hiddenConditions: moved.hidden } : {}),
      }),
    );
  } catch {
    // An unreadable snapshot is left alone, since undo would reject it anyway
  }
}

/**
 * Applies a finished "rename condition" to the stored styles. The rename moves selected sessions, so a source
 * condition only hands over its styles once none of its sessions are left. Styles of a condition that still has
 * sessions stay where they are.
 */
export function syncConditionRenameStyles(
  group: string,
  individual: string,
  evaluation: string,
  moved: ModifiedSessionResult[],
  current: ModifiedSessionResult[],
  rename: string,
): void {
  const target = rename.trim();
  const movedFiles = new Set(moved.map((session) => session.Filename));
  const remaining = new Set(
    current.filter((session) => !movedFiles.has(session.Filename)).map((session) => session.SessionSettings.Condition),
  );
  const emptied = [...new Set(moved.map((session) => session.SessionSettings.Condition))].filter(
    (condition) => condition !== target && !remaining.has(condition),
  );

  if (emptied.length === 0) {
    return;
  }

  const targetExisted = current.some((session) => session.SessionSettings.Condition === target);

  renameConditionsInLocalStorage(group, individual, evaluation, emptied, target, targetExisted);
}
