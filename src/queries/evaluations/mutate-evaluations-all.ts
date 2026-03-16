import { EvaluationRecord } from '../keysets/types/evaluation-record';
import { evaluationsAllQueryOptions } from './query-evaluations-all';
import { queryClient } from '@/App';

/**
 * This function is responsible for mutating the evaluations associated with a specific group and individual. It takes in the necessary parameters to identify the target evaluations and the action to be performed (in this case, importing evaluations). The function first retrieves the current list of evaluations using React Query's `fetchQuery` method. It then performs the specified action by iterating over the relevant evaluation records and duplicating them in the file system using the provided directory handle. Finally, it returns the updated list of evaluation records after the mutation is complete.
 *
 * @param Handle - The file system directory handle used to access and manipulate the evaluation records.
 * @param Group - The name of the group associated with the evaluations.
 * @param Individual - The name of the individual associated with the evaluations.
 * @param Evaluation - The evaluation record to be duplicated.
 * @returns - A promise that resolves to the updated list of evaluation records after the mutation is complete.
 */
const DuplicateEvaluationRecord = async (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: EvaluationRecord,
): Promise<EvaluationRecord> => {
  const g_folder = await Handle.getDirectoryHandle(Group);
  const i_folder = await g_folder.getDirectoryHandle(Individual);
  const e_folder = await i_folder.getDirectoryHandle(Evaluation.Evaluation, { create: true });

  const conditionList: string[] = [];

  for (const condition of Evaluation.Conditions) {
    await e_folder.getDirectoryHandle(condition, { create: true });

    conditionList.push(condition);
  }

  return {
    Group,
    Individual,
    Evaluation: Evaluation.Evaluation,
    Conditions: conditionList,
  } satisfies EvaluationRecord;
};

/**
 * This function is responsible for mutating the evaluations associated with a specific group and individual. It takes in the necessary parameters to identify the target evaluations and the action to be performed (in this case, importing evaluations). The function first retrieves the current list of evaluations using React Query's `fetchQuery` method. It then performs the specified action by iterating over the relevant evaluation records and duplicating them in the file system using the provided directory handle. Finally, it returns the updated list of evaluation records after the mutation is complete.
 *
 * @param Group - The name of the group associated with the evaluations.
 * @param Individual - The name of the individual associated with the evaluations.
 * @param RelevantRecords - An optional array of evaluation records that are relevant to the mutation action (in this case, the evaluations to be imported).
 * @param Handle - The file system directory handle used to access and manipulate the evaluation records.
 * @param Action - The action to be performed on the evaluations (in this case, 'Import').
 * @returns - A promise that resolves to the updated list of evaluation records after the mutation is complete.
 */
export const mutationEvaluationsAll = async ({
  Group,
  Individual,
  RelevantRecords,
  Handle,
  Action,
}: {
  Group: string;
  Individual: string;
  RelevantRecords?: EvaluationRecord[];
  Handle: FileSystemDirectoryHandle;
  Action: 'Import';
}): Promise<EvaluationRecord[]> => {
  const evaluationsAll: EvaluationRecord[] = await queryClient.fetchQuery(evaluationsAllQueryOptions(Handle));

  if (!evaluationsAll) {
    throw new Error('Evaluations not found');
  }

  const newEvaluationRecordsList = evaluationsAll;

  switch (Action) {
    case 'Import': {
      for (const evaluation of RelevantRecords ?? []) {
        const newEntry = await DuplicateEvaluationRecord(Handle, Group, Individual, evaluation);

        newEvaluationRecordsList.push(newEntry);
      }

      break;
    }
  }

  return newEvaluationRecordsList;
};
