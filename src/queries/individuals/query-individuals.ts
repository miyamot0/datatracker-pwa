import { FolderHandleContextType } from '@/context/folder-context';
import { CleanUpString } from '@/lib/strings';

export const fetchIndividuals = async ({ Context, Group }: { Context: FolderHandleContextType; Group: string }) => {
  const { handle } = Context;

  const temp_individuals = [] as string[];

  try {
    const files = await handle!.getDirectoryHandle(CleanUpString(Group));
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
