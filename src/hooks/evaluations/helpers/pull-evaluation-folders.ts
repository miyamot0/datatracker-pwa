import { CleanUpString } from '@/lib/strings';
import { QueryResponseEvaluations } from '../types/query-response-type-evaluations';

/**
 * Pulls all evaluation folders from the provided directory handle.
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @param Client The client name
 * @returns Evaluations in the relevant directory
 */
export const pullEvaluationFolders = async (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Client: string
): Promise<QueryResponseEvaluations> => {
  try {
    const group_folder = await Handle.getDirectoryHandle(CleanUpString(Group));
    const individual_folder = await group_folder.getDirectoryHandle(CleanUpString(Client));
    const entries = await individual_folder.values();

    const temp_evaluation_folders = [] as string[];

    for await (const entry of entries) {
      if (entry.name === '.DS_Store') continue;

      if (entry.kind === 'directory') temp_evaluation_folders.push(entry.name);
    }

    return {
      status: 'success',
      data: temp_evaluation_folders,
    };
  } catch (error) {
    return {
      status: 'error',
      data: [],
      error: error as string,
    };
  }
};
