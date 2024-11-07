import { QueryResponseGroups } from '../types/query-response-type-groups';

/**
 * Pulls all group folders from the provided directory handle.
 *
 * @param Handle The handle to the file system
 * @returns Groups in the relevant directory
 */
export const pullGroupFolders = async (Handle: FileSystemDirectoryHandle): Promise<QueryResponseGroups> => {
  try {
    const entries = await Handle.values();
    const temp_group_folders = [] as string[];

    for await (const entry of entries) {
      if (entry.kind === 'directory' && entry.name !== '.DS_Store') {
        temp_group_folders.push(entry.name);
      }
    }

    return {
      status: 'success',
      data: temp_group_folders,
    };
  } catch (error) {
    return {
      status: 'error',
      data: [],
      error: error as string,
    };
  }
};
