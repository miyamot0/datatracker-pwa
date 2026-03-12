import { evaluationsAllQueryOptions } from './query-evaluations-all';
import { EvaluationRecord } from '../keysets/mutate-keyboards';
import { queryClient } from '@/App';

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
