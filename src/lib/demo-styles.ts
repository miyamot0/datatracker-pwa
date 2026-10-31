import { DemoArchiveFile, extractDemoArchive, fetchVerifiedDemoArchive } from '@/lib/demo-archive';
import { RESERVED_STYLES_FILE_NAME } from '@/lib/reserved-names';
import { StylesFile, applyStylesFile, parseStylesFile } from '@/lib/styles-file';
import { DemoDataFolderName } from '@/lib/query-mutate';

export type DemoStylesEntry = {
  individual: string;
  evaluation: string;
  styles: StylesFile;
};

/**
 * Parses the styles.json files bundled with the demo archive. Runs on the main thread, since workers cannot access local storage.
 * Rejects if any bundled styles file is invalid, so callers can fail before writing any demo files.
 *
 * @param loadArchive - Returns the verified demo archive bytes.
 * @returns The parsed styles, keyed by the participant (individual) and evaluation they belong to.
 */
export async function loadDemoStyles(
  loadArchive: () => Promise<Uint8Array> = () => fetchVerifiedDemoArchive(),
): Promise<DemoStylesEntry[]> {
  const demoFiles: DemoArchiveFile[] = extractDemoArchive(await loadArchive());

  return demoFiles
    .filter((file) => file.filename === RESERVED_STYLES_FILE_NAME && file.path.length === 2)
    .map((file) => ({
      individual: file.path[0],
      evaluation: file.path[1],
      styles: parseStylesFile(new TextDecoder().decode(file.bytes)),
    }));
}

/**
 * Writes parsed demo styles to local storage under the demo group, replacing any previously saved series styles.
 *
 * @param entries - The parsed styles returned by loadDemoStyles.
 */
export function applyDemoStyles(entries: DemoStylesEntry[]): void {
  for (const { individual, evaluation, styles } of entries) {
    applyStylesFile(DemoDataFolderName, individual, evaluation, styles, { replace: true });
  }
}
