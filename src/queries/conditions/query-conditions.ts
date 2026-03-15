import { CleanUpString } from '@/lib/strings';

/**
 * Queries the conditions for a specific group, individual, and evaluation by accessing the file system and retrieving the names of condition directories within the evaluation folder. It returns an array of condition names that are found, or an empty array if no conditions are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the conditions are being queried.
 * @param Individual - The individual identifier for which the conditions are being queried.
 * @param Evaluation - The evaluation identifier for which the conditions are being queried.
 * @returns A promise that resolves to an array of condition names found within the evaluation folder, or an empty array if no conditions are found or if there is an error during the file system operations.
 */
export const conditionQueryOptions = (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string,
) => ({
  queryKey: ['/', Group, Individual, Evaluation, 'conditions'],
  queryFn: () => fetchConditions(Handle, Group, Individual, Evaluation),
});

/**
 * Fetches the conditions for a specific group, individual, and evaluation by accessing the file system and retrieving the names of condition directories within the evaluation folder. It returns an array of condition names that are found, or an empty array if no conditions are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the conditions are being fetched.
 * @param Individual - The individual identifier for which the conditions are being fetched.
 * @param Evaluation - The evaluation identifier for which the conditions are being fetched.
 * @returns A promise that resolves to an array of condition names found within the evaluation folder, or an empty array if no conditions are found or if there is an error during the file system operations.
 */
export const fetchConditions = async (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string,
) => {
  const conditions: string[] = [];

  try {
    const group_folder = await Handle.getDirectoryHandle(CleanUpString(Group));
    const individual_folder = await group_folder.getDirectoryHandle(CleanUpString(Individual));
    const evaluations = await individual_folder.getDirectoryHandle(CleanUpString(Evaluation));

    const entries = await evaluations.values();

    for await (const entry of entries) {
      if (entry.kind === 'directory' && entry.name !== '.DS_Store') {
        conditions.push(entry.name);
      }
    }

    return conditions;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return [];
  }
};
