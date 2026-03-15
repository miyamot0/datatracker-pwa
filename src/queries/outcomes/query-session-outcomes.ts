import { SavedSessionResult } from '@/lib/dtos';
import { CleanUpString } from '@/lib/strings';
import { ModifiedSessionResult } from '@/types/storage';

/**
 * Queries the session outcomes for a specific group, individual, and evaluation by accessing the file system and retrieving the relevant session outcome files. It returns an array of ModifiedSessionResult objects that contain the details of each session outcome found within the file system structure, or an empty array if no session outcomes are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the session outcomes are being queried.
 * @param Individual - The individual identifier for which the session outcomes are being queried.
 * @param Evaluation - The evaluation identifier for which the session outcomes are being queried.
 * @returns A promise that resolves to an array of ModifiedSessionResult objects containing the details of each session outcome found, or an empty array if no session outcomes are found or if there is an error during the file system operations.
 */
export const sessionOutcomesQueryOptions = (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string,
) => ({
  queryKey: ['/', Group, Individual, Evaluation, 'outcomes'],
  queryFn: () => fetchSessionOutcomes({ Handle, Group, Individual, Evaluation }),
});

/**
 * Fetches the session outcomes for a specific group, individual, and evaluation by accessing the file system and retrieving the relevant session outcome files. It returns an array of ModifiedSessionResult objects that contain the details of each session outcome found within the file system structure, or an empty array if no session outcomes are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the session outcomes are being fetched.
 * @param Individual - The individual identifier for which the session outcomes are being fetched.
 * @param Evaluation - The evaluation identifier for which the session outcomes are being fetched.
 * @returns A promise that resolves to an array of ModifiedSessionResult objects containing the details of each session outcome found, or an empty array if no session outcomes are found or if there is an error during the file system operations.
 */
export const fetchSessionOutcomes = async ({
  Handle,
  Group,
  Individual,
  Evaluation,
}: {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
  Evaluation: string;
}): Promise<ModifiedSessionResult[]> => {
  const group_folder = await Handle.getDirectoryHandle(CleanUpString(Group));
  const individual_folder = await group_folder.getDirectoryHandle(CleanUpString(Individual));
  const evaluations = await individual_folder.getDirectoryHandle(CleanUpString(Evaluation));

  const files: FileSystemFileHandle[] = [];

  for await (const entry of evaluations.values()) {
    if (entry.name === '.DS_Store') continue;

    if (entry.kind === 'file' && entry.name.endsWith('.json')) {
      // Skip if the session outcomes file
      if (entry.name === 'settings.json') continue;

      files.push(entry);
    } else if (entry.kind === 'directory') {
      const condition_folder = await evaluations.getDirectoryHandle(entry.name);

      for await (const condition_entry of condition_folder.values()) {
        if (condition_entry.kind === 'file' && condition_entry.name.endsWith('.json')) {
          files.push(condition_entry);
        }
      }
    }
  }

  const session_results: ModifiedSessionResult[] = [];

  for (const file of files) {
    const file_data = await file.getFile();
    const file_text = await file_data.text();

    const session_result: ModifiedSessionResult = {
      ...(JSON.parse(file_text) as SavedSessionResult),
      Filename: file.name,
    };

    if (session_result) {
      session_results.push(session_result);
    }
  }

  return session_results.sort(
    (a, b) => new Date(b.SessionSettings.Session).valueOf() - new Date(a.SessionSettings.Session).valueOf(),
  );
};
