import { queryClient } from '@/App';
import { FolderHandleContextType } from '@/context/folder-context';
import { fetchIndividuals } from './query-individuals';
import { CleanUpString } from '@/lib/strings';

export const mutationIndividuals = async ({
  Group,
  Individual,
  Context,
  Action,
}: {
  Group: string;
  Individual: string[];
  Context: FolderHandleContextType;
  Action: 'Add' | 'Delete';
}): Promise<string[]> => {
  const individuals: string[] = await queryClient.fetchQuery({
    queryKey: ['/', Group],
    queryFn: () => fetchIndividuals({ Context, Group }),
  });

  if (!individuals) {
    throw new Error('Stock not found');
  }

  let newIndividualList = individuals;

  const group_dir = await Context.handle!.getDirectoryHandle(CleanUpString(Group));

  if (Action == 'Add') {
    await group_dir.getDirectoryHandle(Individual[0], { create: true });
    newIndividualList.push(Individual[0]);
  } else if (Action == 'Delete') {
    for (const indiv in individuals) {
      await group_dir.removeEntry(indiv, { recursive: true });
      newIndividualList = newIndividualList.filter((i) => i != indiv);
    }
  }

  return newIndividualList;
};
