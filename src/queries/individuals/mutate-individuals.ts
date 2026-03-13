import { clientQueryOptions } from './query-individuals';
import { CleanUpString } from '@/lib/strings';
import { queryClient } from '@/App';

export const mutationIndividuals = async ({
  Group,
  Individuals,
  Handle,
  Action,
}: {
  Group: string;
  Individuals: string[];
  Handle: FileSystemDirectoryHandle;
  Action: 'Add' | 'Delete';
}): Promise<string[]> => {
  const individuals: string[] = await queryClient.fetchQuery(clientQueryOptions(Handle, Group));

  if (!individuals) {
    throw new Error('Individuals not found');
  }

  let newIndividualList = individuals;

  const group_dir = await Handle.getDirectoryHandle(CleanUpString(Group));

  if (Action == 'Add') {
    await group_dir.getDirectoryHandle(Individuals[0], { create: true });
    newIndividualList.push(Individuals[0]);
  } else if (Action == 'Delete') {
    for (const indiv of Individuals) {
      await group_dir.removeEntry(indiv, { recursive: true });
      newIndividualList = newIndividualList.filter((i) => i != indiv);
    }
  }

  return newIndividualList;
};
