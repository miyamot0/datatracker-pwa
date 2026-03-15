import { CleanUpString } from '@/lib/strings';

/**
 * Queries the individuals for a specific group by accessing the file system and retrieving the names of individual directories within the group's folder. It returns an array of individual names that are found, or an empty array if no individuals are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the individuals are being queried.
 * @returns A promise that resolves to an array of individual names found within the group's folder, or an empty array if no individuals are found or if there is an error during the file system operations.
 */
export const clientQueryOptions = (Handle: FileSystemDirectoryHandle, Group: string) => ({
  queryKey: ['/', Group],
  queryFn: () => fetchIndividuals({ Handle, Group }),
});

/**
 * Fetches the individuals for a specific group by accessing the file system and retrieving the names of individual directories within the group's folder. It returns an array of individual names that are found, or an empty array if no individuals are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the individuals are being fetched.
 * @returns A promise that resolves to an array of individual names found within the group's folder, or an empty array if no individuals are found or if there is an error during the file system operations.
 */
const fetchIndividuals = async ({ Handle, Group }: { Handle: FileSystemDirectoryHandle; Group: string }) => {
  const temp_individuals = [] as string[];

  try {
    const files = await Handle.getDirectoryHandle(CleanUpString(Group));
    const entries = await files.values();

    for await (const entry of entries) {
      if (entry.name === '.DS_Store') continue;

      temp_individuals.push(entry.name);
    }

    return temp_individuals;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return [];
  }
};
