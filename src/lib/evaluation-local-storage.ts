import { CleanUpString } from '@/lib/strings';
import { backupKey } from '@/lib/styles-file';

/** Settings stored once per evaluation. Must mirror the `[Group, Individual, Evaluation, <Name>]` keys in local_storage.ts. */
export const EVALUATION_SETTING_NAMES = [
  'SeriesStyles',
  'HiddenConditions',
  'ShowTooltip',
  'ShowConditionLegend',
  'ShowKeyLegend',
  'SingleTarget',
  'ShowDescription',
] as const;

/** Settings stored once per plot, as `[Group, Individual, Evaluation, <Name>, <Plot>]`. */
export const PLOT_SETTING_NAMES = [
  'ShowTitle',
  'ConnectSpans',
  'FigureLabels',
  'LegendSettings',
  'FontFamily',
  'AxisMax',
  'FigureTextSize',
] as const;

const PLOTS = ['Rate', 'Proportion'] as const;

/** Cached prefs scopes (hidden keys and schedule) used by the figure pages. */
const PREFS_SCOPES = ['Rate', 'Duration'] as const;

export type EvaluationPath = { group: string; individual: string; evaluation: string };

const baseKey = (group: string, individual: string, evaluation: string) => [
  group.trim(),
  individual.trim(),
  evaluation.trim(),
];

/**
 * Every local storage key that belongs to one evaluation. Keys are listed exactly rather than matched by prefix,
 * because "Demand" is a prefix of "Demand_Copy" and names may contain underscores themselves.
 */
export function evaluationStorageKeys(group: string, individual: string, evaluation: string): string[] {
  const base = baseKey(group, individual, evaluation);

  return [
    ...EVALUATION_SETTING_NAMES.map((name) => [...base, name].join('_')),
    ...PLOT_SETTING_NAMES.flatMap((name) => PLOTS.map((plot) => [...base, name, plot].join('_'))),
    ...PREFS_SCOPES.map((scope) => [...base, scope].join('_')),
    // The session viewer caches its hidden keys under a scope named after the evaluation
    [...base, `${group} ${individual} ${evaluation}`].join('_'),
  ];
}

/**
 * Removes every stored setting for one evaluation, including the styles read undo snapshot.
 */
export function clearEvaluationLocalStorage(group: string, individual: string, evaluation: string): void {
  for (const key of evaluationStorageKeys(group, individual, evaluation)) {
    localStorage.removeItem(key);
  }

  sessionStorage.removeItem(backupKey(group, individual, evaluation));
}

/**
 * Makes the target evaluation's stored settings an exact copy of the source's. Keys the source does not have are
 * removed from the target so nothing stale survives. The undo snapshot is per evaluation and is not copied.
 */
export function copyEvaluationLocalStorage(from: EvaluationPath, to: EvaluationPath): void {
  const sourceKeys = evaluationStorageKeys(from.group, from.individual, from.evaluation);
  const targetKeys = evaluationStorageKeys(to.group, to.individual, to.evaluation);

  if (sourceKeys.join('\n') === targetKeys.join('\n')) {
    return;
  }

  sourceKeys.forEach((sourceKey, index) => {
    const value = localStorage.getItem(sourceKey);

    if (value === null) {
      localStorage.removeItem(targetKeys[index]);
    } else {
      localStorage.setItem(targetKeys[index], value);
    }
  });
}

/**
 * Copies stored settings to the new evaluation name, then clears the old name.
 */
export function moveEvaluationLocalStorage(from: EvaluationPath, to: EvaluationPath): void {
  copyEvaluationLocalStorage(from, to);

  if (
    evaluationStorageKeys(from.group, from.individual, from.evaluation).join('\n') !==
    evaluationStorageKeys(to.group, to.individual, to.evaluation).join('\n')
  ) {
    clearEvaluationLocalStorage(from.group, from.individual, from.evaluation);
  }
}

async function listFolderNames(directory: FileSystemDirectoryHandle): Promise<string[]> {
  const names: string[] = [];

  for await (const [name, entry] of directory.entries()) {
    if (entry.kind === 'directory' && name !== '.DS_Store') {
      names.push(name);
    }
  }

  return names;
}

/**
 * Lists the evaluations under the given individuals. Call before the folders are deleted. Returns what could be
 * read, since clearing stored settings is best-effort and must not block a delete.
 */
export async function listEvaluationPathsForIndividuals(
  handle: FileSystemDirectoryHandle,
  group: string,
  individuals: string[],
): Promise<EvaluationPath[]> {
  const paths: EvaluationPath[] = [];

  try {
    const group_dir = await handle.getDirectoryHandle(CleanUpString(group));

    for (const individual of individuals) {
      try {
        const individual_dir = await group_dir.getDirectoryHandle(individual);

        for (const evaluation of await listFolderNames(individual_dir)) {
          paths.push({ group, individual, evaluation });
        }
      } catch (error) {
        console.warn(`Could not list evaluations for ${individual}:`, error);
      }
    }
  } catch (error) {
    console.warn(`Could not list individuals for ${group}:`, error);
  }

  return paths;
}

/**
 * Lists every evaluation under the given groups. Call before the folders are deleted.
 */
export async function listEvaluationPathsForGroups(
  handle: FileSystemDirectoryHandle,
  groups: string[],
): Promise<EvaluationPath[]> {
  const paths: EvaluationPath[] = [];

  for (const group of groups) {
    try {
      const group_dir = await handle.getDirectoryHandle(group);

      for (const individual of await listFolderNames(group_dir)) {
        paths.push(...(await listEvaluationPathsForIndividuals(handle, group, [individual])));
      }
    } catch (error) {
      console.warn(`Could not list individuals for ${group}:`, error);
    }
  }

  return paths;
}

/**
 * Clears stored settings for each path. Errors are logged and swallowed so a storage problem never fails a
 * file operation that already succeeded.
 */
export function clearEvaluationPaths(paths: EvaluationPath[]): void {
  for (const { group, individual, evaluation } of paths) {
    try {
      clearEvaluationLocalStorage(group, individual, evaluation);
    } catch (error) {
      console.warn(`Could not clear stored settings for ${group} / ${individual} / ${evaluation}:`, error);
    }
  }
}
