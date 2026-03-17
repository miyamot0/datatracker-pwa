import { SyncEntryTableRow } from '@/types/sync';

/**
 * Helper function to read a file as text using FileReader API
 *
 * @param file - The File object to be read
 * @returns A promise that resolves with the file content as a string
 */
export function readFileAsync(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Helper function to get a file handle from a directory handle and a path, creating directories/files as needed
 *
 * @param localHandle - The root directory handle to start from
 * @param path - The path to the file, with directories separated by '/'
 * @returns A promise that resolves with the file handle, or undefined if the localHandle is not provided
 */
export async function getFileHandle(
  localHandle: FileSystemDirectoryHandle,
  path: string,
): Promise<FileSystemFileHandle | undefined> {
  if (!localHandle) return;

  const path_parts = path.split('/').filter((part) => part.trim().length > 0);
  if (path_parts.length === 0) throw new Error('Invalid Path');

  let handle_rem = localHandle;

  for (let i = 0; i < path_parts.length; i++) {
    const is_file = i === path_parts.length - 1;

    if (is_file) {
      const file_handle_rem = await handle_rem.getFileHandle(path_parts[i], { create: true });

      return file_handle_rem;
    } else {
      handle_rem = await handle_rem.getDirectoryHandle(path_parts[i], { create: true });
    }
  }
}

/**
 * Writes the content of a local file to a remote file in the specified remote directory, using the provided file path and handles. It reads the content of the local file, creates or gets the corresponding file handle in the remote directory, and writes the content to the remote file.
 *
 * @param remoteDirectory - The remote directory handle where the file should be written
 * @param handle - The local directory handle where the file is located
 * @param value - The sync entry containing the file path and other metadata
 * @returns A promise that resolves when the file has been written to the remote directory
 */
export async function writeOutFileToRemote(
  remoteDirectory: FileSystemDirectoryHandle,
  handle: FileSystemDirectoryHandle,
  value: SyncEntryTableRow,
) {
  if (!remoteDirectory || !handle) return;

  const path_parts = value.file.split('/').filter((part) => part.trim().length > 0);

  if (path_parts.length === 0) return;

  const file_lcl = await getFileHandle(handle, value.file);
  const file_lcl_contents = await file_lcl?.getFile();
  const text = await readFileAsync(file_lcl_contents!);

  const file_handle_rem = await getFileHandle(remoteDirectory, value.file);
  const writer = await file_handle_rem?.createWritable();
  await writer?.write(new Blob([text as string]));
  await writer?.close();
}

/**
 * Synchronizes all files listed in the provided rows from the local directory to the remote directory. It iterates through each row, writes the corresponding file to the remote directory using the writeOutFileToRemote function, and keeps track of the files that were added. After all files have been processed, it updates the remote file list state using the provided SetRemoteCallback.
 *
 * @param rows - An array of SyncEntryTableRow objects representing the files to be synchronized, each containing the file path and other metadata.
 * @param Handle - The local directory handle where the files are located.
 * @param RemoteHandle - The remote directory handle where the files should be written.
 * @param SetRemoteCallback - A callback function to update the state of the remote file list after synchronization.
 * @returns A promise that resolves when all files have been synchronized and the remote file list has been updated.
 */
export async function syncAllFiles(
  rows: SyncEntryTableRow[],
  Handle: FileSystemDirectoryHandle,
  RemoteHandle: FileSystemDirectoryHandle,
  SetRemoteCallback: React.Dispatch<React.SetStateAction<string[]>>,
) {
  const files_added: string[] = [];
  for (const row of rows) {
    writeOutFileToRemote(RemoteHandle, Handle, row);
    files_added.push(row.file);
  }

  SetRemoteCallback((prev) => [...(prev ?? []), ...files_added]);
}
