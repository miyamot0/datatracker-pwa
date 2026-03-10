import { FolderHandleContextType } from '@/context/folder-context';
import { CleanUpString } from '@/lib/strings';

export const fetchEvaluations = async ({
  Context,
  Group,
  Individual,
}: {
  Context: FolderHandleContextType;
  Group: string;
  Individual: string;
}) => {
  const { handle } = Context;

  const temp_evaluations = [] as string[];

  try {
    const group_folder = await handle!.getDirectoryHandle(CleanUpString(Group));
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
