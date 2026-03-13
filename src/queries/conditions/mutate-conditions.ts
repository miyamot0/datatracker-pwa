import { CleanUpString } from '@/lib/strings';
import { fetchConditions } from './query-conditions';
import { queryClient } from '@/App';

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
