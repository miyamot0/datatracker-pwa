import { CleanUpString } from '@/lib/strings';
import { fetchConditions } from './query-conditions';
import { queryClient } from '@/App';

/**
 * This function is responsible for mutating the conditions associated with a specific group, individual, and evaluation. It takes in the necessary parameters to identify the target evaluation and the condition to be added. The function first retrieves the current list of conditions using React Query's `fetchQuery` method. It then performs the specified action (in this case, adding a new condition) by interacting with the file system through the provided directory handle. Finally, it returns the updated list of conditions after the mutation is complete.
 *
 * @param Group - The name of the group associated with the evaluation.
 * @param Individual - The name of the individual associated with the evaluation.
 * @param Evaluation - The name of the evaluation to which the condition will be added.
 * @param Condition - The name of the condition to be added to the evaluation.
 * @param Handle - The file system directory handle used to access and manipulate the evaluation records.
 * @param Action - The action to be performed on the conditions (in this case, 'Add').
 * @returns - A promise that resolves to the updated list of conditions after the mutation is complete.
 */
export const mutationConditions = async ({
  Group,
  Individual,
  Evaluation,
  Condition,
  Handle,
  Action,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  Condition: string;
  Handle: FileSystemDirectoryHandle;
  Action: 'Add';
}): Promise<string[]> => {
  const conditions: string[] = await queryClient.fetchQuery({
    queryKey: ['/', Group, Individual, Evaluation, 'conditions'],
    queryFn: () => fetchConditions(Handle, Group, Individual, Evaluation),
  });

  if (!conditions) {
    throw new Error('Conditions not found');
  }

  const newConditionsList = conditions;

  const group_dir = await Handle.getDirectoryHandle(CleanUpString(Group));
  const individual_dir = await group_dir.getDirectoryHandle(CleanUpString(Individual));
  const evaluation_dir = await individual_dir.getDirectoryHandle(CleanUpString(Evaluation));

  switch (Action) {
    case 'Add':
      await evaluation_dir.getDirectoryHandle(Condition, { create: true });
      newConditionsList.push(Condition);

      break;
  }

  return newConditionsList;
};
