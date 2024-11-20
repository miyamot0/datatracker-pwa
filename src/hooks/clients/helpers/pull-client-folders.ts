import { CleanUpString } from '@/lib/strings';
import { QueryResponseClients } from '../types/query-response-type-clients';

/**
 * Pulls all client folders from the provided directory handle.
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @returns Clients in the relevant directory
 */
export const pullClientFolders = async (
  Handle: FileSystemDirectoryHandle,
  Group: string
): Promise<QueryResponseClients> => {
  try {
    const files = await Handle.getDirectoryHandle(CleanUpString(Group));
    const entries = await files.values();
    const temp_individuals = [] as string[];

    for await (const entry of entries) {
      if (entry.name === '.DS_Store') continue;

      temp_individuals.push(entry.name);
    }

    return {
      status: 'success',
      data: temp_individuals,
    };
  } catch (error) {
    return {
      status: 'error',
      data: [],
      error: error as string,
    };
  }
};
