/**
 * Fallback sync operations that run on the main thread
 * Used as backup when web worker approach fails
 * Uses async/await with proper yielding to keep UI responsive
 */

import { useCallback } from 'react';
import { SyncEntryTableRow } from '@/types/sync';

// Helper function to yield to the event loop
const yieldToEventLoop = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Recursively reads directory structure and builds file path array
 */
async function iterativeRead(
  entry: FileSystemDirectoryHandle | FileSystemFileHandle,
  path: string,
  pathArray: string[],
  processedCount: { count: number },
): Promise<void> {
  if (entry.kind === 'file') {
    pathArray.push(path);
  } else if (entry.kind === 'directory') {
    const entries = entry.values();

    for await (const subEntry of entries) {
      await iterativeRead(subEntry, path + '/' + subEntry.name, pathArray, processedCount);

      // Yield periodically to keep UI responsive
      processedCount.count++;
      if (processedCount.count % 10 === 0) {
        await yieldToEventLoop();
      }
    }
  }
}

/**
 * Lists all files in a directory handle with UI responsiveness
 */
async function listFilesInDirectory(handle: FileSystemDirectoryHandle): Promise<string[]> {
  const pathArray: string[] = [];
  const processedCount = { count: 0 };
  const groups = handle.values();

  for await (const group of groups) {
    if (group.kind === 'directory') {
      await iterativeRead(group, `/${group.name}`, pathArray, processedCount);
    }

    // Yield after each top-level directory
    await yieldToEventLoop();
  }

  return pathArray;
}

/**
 * Reads file as text using FileReader API
 */
function readFileAsync(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Gets or creates a file handle from a directory handle and path
 */
async function getFileHandle(
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
 */
async function writeFileToTarget(
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

export function useMainThreadSync() {
  const listLocalFiles = useCallback(async (handle: FileSystemDirectoryHandle): Promise<string[]> => {
    console.log('Listing local files on main thread...');
    return await listFilesInDirectory(handle);
  }, []);

  const listRemoteFiles = useCallback(async (handle: FileSystemDirectoryHandle): Promise<string[]> => {
    console.log('Listing remote files on main thread...');
    return await listFilesInDirectory(handle);
  }, []);

  const listBothFiles = useCallback(
    async (
      localHandle: FileSystemDirectoryHandle,
      remoteHandle: FileSystemDirectoryHandle,
    ): Promise<{ localFiles: string[]; remoteFiles: string[] }> => {
      console.log('Listing both files on main thread...');
      const [localFiles, remoteFiles] = await Promise.all([
        listFilesInDirectory(localHandle),
        listFilesInDirectory(remoteHandle),
      ]);

      console.log('Files listed - local:', localFiles.length, 'remote:', remoteFiles.length);
      return { localFiles, remoteFiles };
    },
    [],
  );

  const syncFiles = useCallback(
    async (
      rows: SyncEntryTableRow[],
      sourceHandle: FileSystemDirectoryHandle,
      targetHandle: FileSystemDirectoryHandle,
    ): Promise<string[]> => {
      console.log('Syncing files on main thread...');
      const syncedFiles: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          await writeFileToTarget(targetHandle, sourceHandle, row.file);
          syncedFiles.push(row.file);

          // Yield every few files to keep UI responsive
          if (i % 3 === 0) {
            await yieldToEventLoop();
          }
        } catch (error) {
          console.error(`Failed to sync file ${row.file}:`, error);
          // Continue with other files even if one fails
        }
      }

      console.log('Files synced on main thread:', syncedFiles.length);
      return syncedFiles;
    },
    [],
  );

  return {
    listLocalFiles,
    listRemoteFiles,
    listBothFiles,
    syncFiles,
    isWorkerReady: true, // Always ready since it's main thread
  };
}
