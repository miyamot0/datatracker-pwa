import { CleanUpString } from '@/lib/strings';

/**
 * Queries the evaluations for a specific group and individual by accessing the file system and retrieving the names of evaluation directories within the individual's folder. It returns an array of evaluation names that are found, or an empty array if no evaluations are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the evaluations are being queried.
 * @param Individual - The individual identifier for which the evaluations are being queried.
 * @returns A promise that resolves to an array of evaluation names found within the individual's folder, or an empty array if no evaluations are found or if there is an error during the file system operations.
 */
export const evaluationQueryOptions = (Handle: FileSystemDirectoryHandle, Group: string, Individual: string) => ({
  queryKey: ['/', Group, Individual],
  queryFn: () => fetchEvaluations({ Handle, Group, Individual }),
});

/**
 * Fetches the evaluations for a specific group and individual by accessing the file system and retrieving the names of evaluation directories within the individual's folder. It returns an array of evaluation names that are found, or an empty array if no evaluations are found or if there is an error during the file system operations.
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the evaluations are being fetched.
 * @param Individual - The individual identifier for which the evaluations are being fetched.
 * @returns A promise that resolves to an array of evaluation names found within the individual's folder, or an empty array if no evaluations are found or if there is an error during the file system operations.
 */
const fetchEvaluations = async ({
  Handle,
  Group,
  Individual,
}: {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
}) => {
  const temp_evaluations = [] as string[];

  try {
    const group_folder = await Handle.getDirectoryHandle(CleanUpString(Group));
    const individual_folder = await group_folder.getDirectoryHandle(CleanUpString(Individual));
    const entries = await individual_folder.values();

    for await (const entry of entries) {
      if (entry.name === '.DS_Store') continue;

      if (entry.kind === 'directory') temp_evaluations.push(entry.name);
    }

    return temp_evaluations;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return [];
  }
};
