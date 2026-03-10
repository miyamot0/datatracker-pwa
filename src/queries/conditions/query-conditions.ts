import { FolderHandleContextType } from '@/context/folder-context';
import { CleanUpString } from '@/lib/strings';

export const fetchConditions = async (
  Context: FolderHandleContextType,
  Group: string,
  Individual: string,
  Evaluation: string,
) => {
  const { handle } = Context;
  const conditions: string[] = [];

  try {
    const group_folder = await handle!.getDirectoryHandle(CleanUpString(Group));
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
