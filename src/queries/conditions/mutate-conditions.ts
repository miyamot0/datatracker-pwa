import { FolderHandleContextType } from '@/context/folder-context';
import { CleanUpString } from '@/lib/strings';
import { queryClient } from '@/context/query-client';
import { fetchConditions } from './query-conditions';

export const mutationConditions = async ({
  Group,
  Individual,
  Evaluation,
  Condition,
  Context,
  Action,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  Condition: string;
  Context: FolderHandleContextType;
  Action: 'Add';
}): Promise<string[]> => {
  const conditions: string[] = await queryClient.fetchQuery({
    queryKey: ['/', Group, Individual, Evaluation, 'conditions'],
    queryFn: () => fetchConditions(Context, Group, Individual, Evaluation),
  });

  if (!conditions) {
    throw new Error('Conditions not found');
  }

  const newConditionsList = conditions;

  const group_dir = await Context.handle!.getDirectoryHandle(CleanUpString(Group));
  const individual_dir = await group_dir.getDirectoryHandle(Individual);
  const evaluation_dir = await individual_dir.getDirectoryHandle(Evaluation);

  switch (Action) {
    case 'Add':
      await evaluation_dir.getDirectoryHandle(Condition, { create: true });
      newConditionsList.push(Condition);

      break;
  }

  return newConditionsList;
};
