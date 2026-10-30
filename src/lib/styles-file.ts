import { CleanUpString } from '@/lib/strings';
import { RESERVED_STYLES_FILE_NAME } from '@/lib/reserved-names';
import {
  getLocalConnectSpans,
  getLocalFigureAxisMax,
  getLocalFigureFontFamily,
  getLocalFigureLabels,
  getLocalLegendSettings,
  getLocalSeriesStyles,
  getLocalShowConditionLegend,
  getLocalShowDescription,
  getLocalShowTitle,
  getLocalShowTooltip,
  setLocalConnectSpans,
  setLocalFigureAxisMax,
  setLocalFigureFontFamily,
  setLocalFigureLabels,
  setLocalLegendSettings,
  setLocalSeriesStyles,
  setLocalShowConditionLegend,
  setLocalShowDescription,
  setLocalShowTitle,
  setLocalShowTooltip,
} from '@/lib/local_storage';
import { type SeriesStyles } from '@/lib/graphing/series-style';
import { type FigureLabelSettings } from '@/lib/graphing/figure-labels';
import { type LegendSettings } from '@/lib/graphing/legend-settings';
import {
  FIGURE_FONT_FAMILIES,
  isValidFigureAxisMaxSettings,
  type FigureAxisMaxSettings,
  type FigureFontFamily,
} from '@/lib/graphing/figure-text-settings';

export type StylesPlot = 'Rate' | 'Proportion';
const PLOTS: StylesPlot[] = ['Rate', 'Proportion'];

export type StylesPlotSettings = {
  showTitle?: boolean;
  connectSpans?: boolean;
  figureLabels?: FigureLabelSettings;
  legendSettings?: LegendSettings;
  fontFamily?: FigureFontFamily;
  axisMax?: FigureAxisMaxSettings;
};

/**
 * Contents of styles.json. Every field is optional so hand-made or partial files merge cleanly.
 */
export type StylesFile = {
  version: 1;
  seriesStyles?: SeriesStyles;
  showTooltip?: boolean;
  showConditionLegend?: boolean;
  showDescription?: boolean;
  plots?: Partial<Record<StylesPlot, StylesPlotSettings>>;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Validates styles.json text before anything is written to local storage. Throws with a readable message on failure.
 */
export function parseStylesFile(text: string): StylesFile {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${RESERVED_STYLES_FILE_NAME} is not valid JSON`);
  }

  if (!isPlainObject(parsed) || parsed.version !== 1) {
    throw new Error(`${RESERVED_STYLES_FILE_NAME} must be an object with version 1`);
  }

  for (const key of ['showTooltip', 'showConditionLegend', 'showDescription'] as const) {
    if (parsed[key] !== undefined && typeof parsed[key] !== 'boolean') {
      throw new Error(`${key} must be true or false`);
    }
  }

  if (parsed.seriesStyles !== undefined) {
    const styles = parsed.seriesStyles;

    if (!isPlainObject(styles)) {
      throw new Error('seriesStyles must be an object');
    }

    for (const key of ['KeyStyles', 'ConditionStyles'] as const) {
      if (styles[key] !== undefined && !isPlainObject(styles[key])) {
        throw new Error(`seriesStyles.${key} must be an object`);
      }
    }

    for (const key of ['phase_changes', 'text_annotations', 'aim_lines'] as const) {
      if (styles[key] !== undefined && !Array.isArray(styles[key])) {
        throw new Error(`seriesStyles.${key} must be a list`);
      }
    }
  }

  if (parsed.plots !== undefined) {
    if (!isPlainObject(parsed.plots)) {
      throw new Error('plots must be an object');
    }

    for (const plot of PLOTS) {
      const plotSettings = parsed.plots[plot];

      if (plotSettings === undefined) {
        continue;
      }

      if (!isPlainObject(plotSettings)) {
        throw new Error(`plots.${plot} must be an object`);
      }

      for (const key of ['showTitle', 'connectSpans'] as const) {
        if (plotSettings[key] !== undefined && typeof plotSettings[key] !== 'boolean') {
          throw new Error(`plots.${plot}.${key} must be true or false`);
        }
      }

      for (const key of ['figureLabels', 'legendSettings'] as const) {
        if (plotSettings[key] !== undefined && !isPlainObject(plotSettings[key])) {
          throw new Error(`plots.${plot}.${key} must be an object`);
        }
      }

      if (
        plotSettings.fontFamily !== undefined &&
        !FIGURE_FONT_FAMILIES.includes(plotSettings.fontFamily as FigureFontFamily)
      ) {
        throw new Error(`plots.${plot}.fontFamily must be one of: ${FIGURE_FONT_FAMILIES.join(', ')}`);
      }

      if (plotSettings.axisMax !== undefined && !isValidFigureAxisMaxSettings(plotSettings.axisMax)) {
        throw new Error(
          `plots.${plot}.axisMax must have overrideXMax and overrideYMax as true or false, and xMax and yMax as positive whole numbers or null`,
        );
      }
    }
  }

  return parsed as StylesFile;
}

/**
 * Snapshot of the current local storage styles for one Group/Individual/Evaluation, covering both plots.
 */
export function buildStylesFile(group: string, individual: string, evaluation: string): StylesFile {
  const plots = Object.fromEntries(
    PLOTS.map((plot) => [
      plot,
      {
        showTitle: getLocalShowTitle(group, individual, evaluation, plot),
        connectSpans: getLocalConnectSpans(group, individual, evaluation, plot),
        figureLabels: getLocalFigureLabels(group, individual, evaluation, plot),
        legendSettings: getLocalLegendSettings(group, individual, evaluation, plot),
        fontFamily: getLocalFigureFontFamily(group, individual, evaluation, plot),
        axisMax: getLocalFigureAxisMax(group, individual, evaluation, plot),
      },
    ]),
  ) as Record<StylesPlot, StylesPlotSettings>;

  return {
    version: 1,
    seriesStyles: getLocalSeriesStyles(group, individual, evaluation),
    showTooltip: getLocalShowTooltip(group, individual, evaluation),
    showConditionLegend: getLocalShowConditionLegend(group, individual, evaluation),
    showDescription: getLocalShowDescription(group, individual, evaluation),
    plots,
  };
}

/**
 * Applies a validated styles file to local storage.
 * Default (merge): only fields present in the file change, and series style records merge by key.
 * With `replace`: series styles are overwritten exactly, which is used when restoring a backup.
 */
export function applyStylesFile(
  group: string,
  individual: string,
  evaluation: string,
  file: StylesFile,
  options: { replace?: boolean } = {},
) {
  if (file.seriesStyles) {
    const existing = getLocalSeriesStyles(group, individual, evaluation);
    const incoming = file.seriesStyles;

    setLocalSeriesStyles(
      group,
      individual,
      evaluation,
      options.replace
        ? {
            KeyStyles: incoming.KeyStyles ?? {},
            ConditionStyles: incoming.ConditionStyles ?? {},
            phase_changes: incoming.phase_changes ?? [],
            text_annotations: incoming.text_annotations ?? [],
            aim_lines: incoming.aim_lines ?? [],
          }
        : {
            KeyStyles: { ...existing.KeyStyles, ...incoming.KeyStyles },
            ConditionStyles: { ...existing.ConditionStyles, ...incoming.ConditionStyles },
            phase_changes: incoming.phase_changes ?? existing.phase_changes,
            text_annotations: incoming.text_annotations ?? existing.text_annotations,
            aim_lines: incoming.aim_lines ?? existing.aim_lines,
          },
    );
  }

  if (file.showTooltip !== undefined) {
    setLocalShowTooltip(group, individual, evaluation, file.showTooltip);
  }

  if (file.showConditionLegend !== undefined) {
    setLocalShowConditionLegend(group, individual, evaluation, file.showConditionLegend);
  }

  if (file.showDescription !== undefined) {
    setLocalShowDescription(group, individual, evaluation, file.showDescription);
  }

  for (const plot of PLOTS) {
    const plotSettings = file.plots?.[plot];

    if (!plotSettings) {
      continue;
    }

    if (plotSettings.showTitle !== undefined) {
      setLocalShowTitle(group, individual, evaluation, plot, plotSettings.showTitle);
    }

    if (plotSettings.connectSpans !== undefined) {
      setLocalConnectSpans(group, individual, evaluation, plot, plotSettings.connectSpans);
    }

    if (plotSettings.figureLabels) {
      setLocalFigureLabels(group, individual, evaluation, plot, plotSettings.figureLabels);
    }

    if (plotSettings.legendSettings) {
      setLocalLegendSettings(group, individual, evaluation, plot, plotSettings.legendSettings);
    }

    if (plotSettings.fontFamily !== undefined) {
      setLocalFigureFontFamily(group, individual, evaluation, plot, plotSettings.fontFamily);
    }

    if (plotSettings.axisMax) {
      setLocalFigureAxisMax(group, individual, evaluation, plot, plotSettings.axisMax);
    }
  }
}

const backupKey = (group: string, individual: string, evaluation: string) =>
  `styles-backup:${group}|${individual}|${evaluation}`;

/**
 * Keeps a snapshot of the current local storage styles in session storage so a styles read can be undone.
 * Session storage is per tab and is not part of the user's files.
 */
export function saveStylesBackup(group: string, individual: string, evaluation: string): void {
  sessionStorage.setItem(
    backupKey(group, individual, evaluation),
    JSON.stringify(buildStylesFile(group, individual, evaluation)),
  );
}

/**
 * Restores the snapshot saved by saveStylesBackup exactly, then clears it. Returns false when no backup exists.
 */
export function restoreStylesBackup(group: string, individual: string, evaluation: string): boolean {
  const key = backupKey(group, individual, evaluation);
  const raw = sessionStorage.getItem(key);

  if (raw === null) {
    return false;
  }

  applyStylesFile(group, individual, evaluation, parseStylesFile(raw), { replace: true });
  sessionStorage.removeItem(key);
  return true;
}

async function getEvaluationFolder(
  handle: FileSystemDirectoryHandle,
  group: string,
  individual: string,
  evaluation: string,
): Promise<FileSystemDirectoryHandle> {
  const group_folder = await handle.getDirectoryHandle(CleanUpString(group));
  const individual_folder = await group_folder.getDirectoryHandle(CleanUpString(individual));
  return individual_folder.getDirectoryHandle(CleanUpString(evaluation));
}

/**
 * Writes styles.json beside settings.json in the evaluation folder, replacing any existing file.
 */
export async function writeStylesFile(
  handle: FileSystemDirectoryHandle,
  group: string,
  individual: string,
  evaluation: string,
): Promise<void> {
  const evaluations = await getEvaluationFolder(handle, group, individual, evaluation);
  const file = await evaluations.getFileHandle(RESERVED_STYLES_FILE_NAME, { create: true });
  const writer = await file.createWritable();

  await writer.write(JSON.stringify(buildStylesFile(group, individual, evaluation), null, 2));
  await writer.close();
}

/**
 * Reads and validates styles.json. Returns null when the file does not exist. Throws when it exists but is invalid.
 */
export async function readStylesFile(
  handle: FileSystemDirectoryHandle,
  group: string,
  individual: string,
  evaluation: string,
): Promise<StylesFile | null> {
  const evaluations = await getEvaluationFolder(handle, group, individual, evaluation);

  let fileHandle: FileSystemFileHandle;

  try {
    fileHandle = await evaluations.getFileHandle(RESERVED_STYLES_FILE_NAME);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      return null;
    }

    throw error;
  }

  const file = await fileHandle.getFile();
  return parseStylesFile(await file.text());
}

/**
 * Deletes styles.json from the evaluation folder. Returns false when there was nothing to delete.
 */
export async function deleteStylesFile(
  handle: FileSystemDirectoryHandle,
  group: string,
  individual: string,
  evaluation: string,
): Promise<boolean> {
  const evaluations = await getEvaluationFolder(handle, group, individual, evaluation);

  try {
    await evaluations.removeEntry(RESERVED_STYLES_FILE_NAME);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      return false;
    }

    throw error;
  }
}
