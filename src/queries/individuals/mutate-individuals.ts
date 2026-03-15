import { clientQueryOptions } from './query-individuals';
import { CleanUpString } from '@/lib/strings';
import { queryClient } from '@/App';

/**
 * This function is responsible for mutating the individuals associated with a specific group. It takes in the necessary parameters to identify the target group and the individuals to be added or deleted. The function first retrieves the current list of individuals using React Query's `fetchQuery` method. It then performs the specified action (adding or deleting individuals) by interacting with the file system through the provided directory handle. Finally, it returns the updated list of individual names after the mutation is complete.
 * @param Group - The name of the group associated with the individuals.
 * @param Individuals - An array of individual names that are relevant to the mutation action (in this case, the individuals to be added or deleted).
 * @param Handle - The file system directory handle used to access and manipulate the individual records.
 * @param Action - The action to be performed on the individuals (in this case, 'Add' or 'Delete').
 * @returns - A promise that resolves to the updated list of individual names after the mutation is complete.
 */
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
