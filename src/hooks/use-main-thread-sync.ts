/**
 * Fallback sync operations that run on the main thread
 * Used as backup when web worker approach fails
 * Uses async/await with proper yielding to keep UI responsive
 */

import { useCallback } from 'react';
import { ParsedSyncFile, SyncEntryTableRow } from '@/types/sync';

// Helper function to yield to the event loop
const yieldToEventLoop = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Parses a file path string into a ParsedSyncFile with group/individual/evaluation segments.
 * Expects paths of the form "/Group/Individual/Evaluation.json".
 */
function parseSyncFilePath(path: string): ParsedSyncFile {
  const parts = path.split('/').filter((p) => p.length > 0);
  return {
    file: path,
    group: parts[0] ?? '',
    individual: parts[1] ?? '',
    evaluation: parts[2] ?? '',
  };
}

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
async function listFilesInDirectory(handle: FileSystemDirectoryHandle): Promise<ParsedSyncFile[]> {
  try {
    const pathArray: string[] = [];
    const processedCount = { count: 0 };
    const entries = handle.values();

    for await (const entry of entries) {
      if (entry.kind === 'file') {
        // Handle root-level files
        pathArray.push(`/${entry.name}`);
      } else if (entry.kind === 'directory') {
        // Handle directories recursively
        await iterativeRead(entry, `/${entry.name}`, pathArray, processedCount);
      }

      // Yield after each top-level entry
      await yieldToEventLoop();
    }

    return pathArray.map(parseSyncFilePath);
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
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
 * Gets an existing file handle from a directory handle and path
 */
async function getExistingFileHandle(
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
      try {
        const fileHandleRem = await handleRem.getFileHandle(pathParts[i]);
        return fileHandleRem;
      } catch (error) {
        console.error(`File not found: ${pathParts[i]} in path ${path} - ${error}`);
        return undefined;
      }
    } else {
      try {
        handleRem = await handleRem.getDirectoryHandle(pathParts[i]);
      } catch (error) {
        console.error(`Directory not found: ${pathParts[i]} in path ${path} - ${error}`);
        return undefined;
      }
    }
  }
}

/**
 * Gets or creates a file handle from a directory handle and path
 */
async function getOrCreateFileHandle(
  localHandle: FileSystemDirectoryHandle,
  path: string,
): Promise<FileSystemFileHandle | undefined> {
  if (!localHandle) return;

  const pathParts = path.split('/').filter((part) => part.trim().length > 0);
  if (pathParts.length === 0) throw new Error('Invalid Path');

  let handleRem = localHandle;

  try {
    for (let i = 0; i < pathParts.length; i++) {
      const isFile = i === pathParts.length - 1;

      if (isFile) {
        const fileHandleRem = await handleRem.getFileHandle(pathParts[i], { create: true });
        return fileHandleRem;
      } else {
        handleRem = await handleRem.getDirectoryHandle(pathParts[i], { create: true });
      }
    }
  } catch (error) {
    console.error(`Error creating/accessing target file handle for ${path}:`, error);
    return undefined;
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

  try {
    // Get existing file from source (don't create)
    const sourceFile = await getExistingFileHandle(sourceDirectory, filePath);
    if (!sourceFile) {
      console.error(`Source file not found: ${filePath}`);
      throw new Error(`Source file not found: ${filePath}`);
    }

    const sourceFileContents = await sourceFile.getFile();
    if (!sourceFileContents) {
      console.error(`Could not read source file contents: ${filePath}`);
      throw new Error(`Could not read source file contents: ${filePath}`);
    }

    const text = await readFileAsync(sourceFileContents);

    // Create or get target file handle (can create)
    const targetFileHandle = await getOrCreateFileHandle(targetDirectory, filePath);
    if (!targetFileHandle) {
      console.error(`Could not create target file: ${filePath}`);
      throw new Error(`Could not create target file: ${filePath}`);
    }

    const writer = await targetFileHandle.createWritable();
    await writer.write(new Blob([text]));
    await writer.close();
  } catch (error) {
    console.error(`Error in writeFileToTarget for ${filePath}:`, error);
    throw error;
  }
}

export function useMainThreadSync() {
  const listLocalFiles = useCallback(async (handle: FileSystemDirectoryHandle): Promise<ParsedSyncFile[]> => {
    try {
      return await listFilesInDirectory(handle);
    } catch (error) {
      console.error('Error listing local files:', error);
      return [];
    }
  }, []);

  const listRemoteFiles = useCallback(async (handle: FileSystemDirectoryHandle): Promise<ParsedSyncFile[]> => {
    try {
      return await listFilesInDirectory(handle);
    } catch (error) {
      console.error('Error listing remote files:', error);
      return [];
    }
  }, []);

  const listBothFiles = useCallback(
    async (
      localHandle: FileSystemDirectoryHandle,
      remoteHandle: FileSystemDirectoryHandle,
    ): Promise<{ localFiles: ParsedSyncFile[]; remoteFiles: ParsedSyncFile[] }> => {
      try {
        const [localFiles, remoteFiles] = await Promise.all([
          listFilesInDirectory(localHandle),
          listFilesInDirectory(remoteHandle),
        ]);

        return { localFiles, remoteFiles };
      } catch (error) {
        console.error('Error listing both files:', error);
        return { localFiles: [], remoteFiles: [] };
      }
    },
    [],
  );

  const syncFiles = useCallback(
    async (
      rows: SyncEntryTableRow[],
      sourceHandle: FileSystemDirectoryHandle,
      targetHandle: FileSystemDirectoryHandle,
    ): Promise<string[]> => {
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
          console.error(`Error syncing file ${row.file}:`, error);
          // Continue with other files even if one fails
        }
      }

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
