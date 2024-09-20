import { LoadingStructure } from '@/types/working';
import { Dispatch, SetStateAction } from 'react';
import { CleanUpString } from './strings';
import { toast } from 'sonner';

/**
 * Get the group folders from the handle
 *
 * @param Handle The handle to the file system
 * @param SetGroups The state setter for the groups
 */
export const getGroupFolders = async (
  Handle: FileSystemDirectoryHandle,
  SetGroups: Dispatch<SetStateAction<LoadingStructure>>
) => {
  try {
    const entries = await Handle.values();
    const temp_group_folders = [] as string[];

    for await (const entry of entries) {
      if (entry.kind === 'directory') {
        temp_group_folders.push(entry.name);
      }
    }

    SetGroups({
      Status: 'complete',
      Values: temp_group_folders,
    });
  } catch (error) {
    SetGroups({
      Status: 'error',
      Values: [],
      Error: error as string,
    });
  }
};

/**
 * Get the individual client folders from the handle
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @param SetIndividuals The state setter for the individuals
 */
export const getIndividualClientFolders = async (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  SetIndividuals: Dispatch<SetStateAction<LoadingStructure>>
) => {
  try {
    const files = await Handle.getDirectoryHandle(CleanUpString(Group));
    const entries = await files.values();
    const temp_individuals = [] as string[];

    for await (const entry of entries) {
      temp_individuals.push(entry.name);
    }

    SetIndividuals({
      Status: 'complete',
      Values: temp_individuals,
    });
  } catch (error) {
    SetIndividuals({
      Status: 'error',
      Values: [],
      Error: error as string,
    });
  }
};

/**
 * Get the evaluation folders from the handle
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @param Individual The individual name
 * @param SetEvaluations The state setter for the evaluations
 */
export const getClientEvaluationFolders = async (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  SetEvaluations: Dispatch<SetStateAction<LoadingStructure>>
) => {
  try {
    const group_folder = await Handle.getDirectoryHandle(Group);
    const individual_folder = await group_folder.getDirectoryHandle(Individual);
    const entries = await individual_folder.values();

    const temp_evaluation_folders = [] as string[];

    for await (const entry of entries) {
      if (entry.kind === 'directory') temp_evaluation_folders.push(entry.name);
    }

    SetEvaluations({
      Status: 'complete',
      Values: temp_evaluation_folders,
    });
  } catch (error) {
    SetEvaluations({
      Status: 'error',
      Values: [],
      Error: error as string,
    });
  }
};

// --- Folder Removal ---

/**
 * Remove the group folder
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @returns
 */
export async function removeGroupFolder(Handle: FileSystemDirectoryHandle, Group: string) {
  const perms = await Handle.requestPermission({ mode: 'readwrite' });

  if (perms === 'denied') {
    toast.error('Permission denied to remove group folder.');
    return;
  }

  return await Handle.removeEntry(Group, { recursive: true });
}

/**
 * Remove the individual client folder
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @param Individual The individual name
 * @returns
 */
export async function removeClientFolder(Handle: FileSystemDirectoryHandle, Group: string, Individual: string) {
  const perms = await Handle.requestPermission({ mode: 'readwrite' });

  if (perms === 'denied') {
    toast.error('Permission denied to remove group folder.');
    return;
  }

  const group_dir = await Handle.getDirectoryHandle(CleanUpString(Group));

  return await group_dir.removeEntry(Individual, { recursive: true });
}

/**
 * Remove the evaluation folder
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @param Individual The individual name
 * @param Evaluation The evaluation name
 * @returns
 */
export async function removeClientEvaluationFolder(
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string
) {
  const perms = await Handle.requestPermission({ mode: 'readwrite' });

  if (perms === 'denied') {
    toast.error('Permission denied to remove group folder.');
    return;
  }

  const group_dir = await Handle.getDirectoryHandle(CleanUpString(Group));
  const client_dir = await group_dir.getDirectoryHandle(CleanUpString(Individual));

  return await client_dir.removeEntry(CleanUpString(Evaluation), {
    recursive: true,
  });
}
