/**
 * Queries the groups by accessing the file system and retrieving the names of group directories. It returns an array of group names that are found, or an empty array if no groups are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @returns A promise that resolves to an array of group names found within the file system, or an empty array if no groups are found or if there is an error during the file system operations.
 */
export const groupQueryOptions = (Handle: FileSystemDirectoryHandle) => ({
  queryKey: ['/'],
  queryFn: () => fetchGroups(Handle),
});

/**
 * Fetches the groups by accessing the file system and retrieving the names of group directories. It returns an array of group names that are found, or an empty array if no groups are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @returns A promise that resolves to an array of group names found within the file system, or an empty array if no groups are found or if there is an error during the file system operations.
 */
const fetchGroups = async (Handle: FileSystemDirectoryHandle) => {
  try {
    const entries = await Handle.values();
    const temp_group_folders = [] as string[];

    for await (const entry of entries) {
      if (entry.kind === 'directory' && entry.name !== '.DS_Store') {
        temp_group_folders.push(entry.name);
      }
    }

    return temp_group_folders;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return [];
  }
};
