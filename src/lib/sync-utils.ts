import { SyncEntryTableRow } from '../workers/sync/types/sync-worker-types';

/**
 * Recursively reads directory structure and builds file path array
 * @param entry - FileSystemDirectoryHandle or FileSystemFileHandle to process
 * @param path - Current path being processed
 * @param pathArray - Array to accumulate file paths
 */
export async function iterativeRead(
  entry: FileSystemDirectoryHandle | FileSystemFileHandle,
  path: string,
  pathArray: string[],
): Promise<void> {
  if (entry.kind === 'file') {
    pathArray.push(path);
  } else if (entry.kind === 'directory') {
    const entries = entry.values();

    for await (const subEntry of entries) {
      await iterativeRead(subEntry, path + '/' + subEntry.name, pathArray);
    }
  }
}

/**
 * Lists all files in a directory handle
 * @param handle - FileSystemDirectoryHandle to list files from
 * @returns Promise<string[]> - Array of file paths
 */
export async function listFilesInDirectory(handle: FileSystemDirectoryHandle): Promise<string[]> {
  const pathArray: string[] = [];
  const groups = handle.values();

  for await (const group of groups) {
    if (group.kind === 'directory') {
      await iterativeRead(group, `/${group.name}`, pathArray);
    }
  }

  return pathArray;
}

/**
 * Reads file as text using FileReader API
 * @param file - File object to read
 * @returns Promise<string> - File contents as text
 */
export function readFileAsync(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Gets or creates a file handle from a directory handle and path
 * @param localHandle - Root directory handle
 * @param path - Path to the file (with "/" separators)
 * @returns Promise<FileSystemFileHandle | undefined> - File handle or undefined if invalid
 */
export async function getFileHandle(
  localHandle: FileSystemDirectoryHandle,
  path: string,
): Promise<FileSystemFileHandle | undefined> {
  if (!localHandle) return;

  const pathParts = path.split('/').filter((part) => part.trim().length > 0);
  if (pathParts.length === 0) throw new Error('Invalid Path');

  let handleRem = localHandle;

  for (let i = 0; i < pathParts.length; i++) {
    const isFile = i === pathParts.length - 1;

    if (isFile) {
      const fileHandleRem = await handleRem.getFileHandle(pathParts[i], { create: true });
      return fileHandleRem;
    } else {
      handleRem = await handleRem.getDirectoryHandle(pathParts[i], { create: true });
    }
  }
}

/**
 * Writes a file from source to target directory
 * @param targetDirectory - Target directory handle
 * @param sourceDirectory - Source directory handle
 * @param filePath - Path of the file to copy
 */
export async function writeFileToTarget(
  targetDirectory: FileSystemDirectoryHandle,
  sourceDirectory: FileSystemDirectoryHandle,
  filePath: string,
): Promise<void> {
  if (!targetDirectory || !sourceDirectory) return;

  const pathParts = filePath.split('/').filter((part) => part.trim().length > 0);
  if (pathParts.length === 0) return;

  const sourceFile = await getFileHandle(sourceDirectory, filePath);
  const sourceFileContents = await sourceFile?.getFile();

  if (!sourceFileContents) return;

  const text = await readFileAsync(sourceFileContents);

  const targetFileHandle = await getFileHandle(targetDirectory, filePath);
  const writer = await targetFileHandle?.createWritable();
  await writer?.write(new Blob([text]));
  await writer?.close();
}

/**
 * Syncs multiple files from source to target directory
 * @param rows - Array of SyncEntryTableRow containing files to sync
 * @param sourceHandle - Source directory handle
 * @param targetHandle - Target directory handle
 * @returns Promise<string[]> - Array of successfully synced file paths
 */
export async function syncFiles(
  rows: SyncEntryTableRow[],
  sourceHandle: FileSystemDirectoryHandle,
  targetHandle: FileSystemDirectoryHandle,
): Promise<string[]> {
  const syncedFiles: string[] = [];

  for (const row of rows) {
    try {
      await writeFileToTarget(targetHandle, sourceHandle, row.file);
      syncedFiles.push(row.file);
    } catch (error) {
      console.error(`Failed to sync file ${row.file}:`, error);
      // Continue with other files even if one fails
    }
  }

  return syncedFiles;
}

/**
 * Validates file path format
 * @param path - File path to validate
 * @returns boolean - True if path is valid
 */
export function validateFilePath(path: string): boolean {
  if (!path || typeof path !== 'string') return false;

  const trimmedPath = path.trim();
  if (trimmedPath.length === 0) return false;

  // Check for invalid characters (basic validation)
  const invalidChars = /[<>"|?*]/;
  if (invalidChars.test(trimmedPath)) return false;

  // Check for control characters (0-31)
  for (let i = 0; i < trimmedPath.length; i++) {
    const charCode = trimmedPath.charCodeAt(i);
    if (charCode >= 0 && charCode <= 31) return false;
  }

  return true;
}

/**
 * Normalizes file path by removing redundant slashes and ensuring proper format
 * @param path - File path to normalize
 * @returns string - Normalized path
 */
export function normalizeFilePath(path: string): string {
  if (!path) return '';

  return path
    .split('/')
    .filter((part) => part.trim().length > 0)
    .join('/');
}
