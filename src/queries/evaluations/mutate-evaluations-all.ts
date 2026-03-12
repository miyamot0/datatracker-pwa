import { FolderHandleContextType } from '@/context/folder-context';
import { queryClient } from '@/context/query-client';
import { fetchEvaluationsAll } from './query-evaluations-all';
import { EvaluationRecord } from '../keysets/mutate-keyboards';

const DuplicateEvaluationRecord = async (
  Context: FolderHandleContextType,
  Group: string,
  Individual: string,
  Evaluation: EvaluationRecord,
): Promise<EvaluationRecord> => {
  const { handle } = Context;

  const g_folder = await handle!.getDirectoryHandle(Group);
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
  Context,
  Action,
}: {
  Group: string;
  Individual: string;
  RelevantRecords?: EvaluationRecord[];
  Context: FolderHandleContextType;
  Action: 'Import';
}): Promise<EvaluationRecord[]> => {
  const evaluationsAll: EvaluationRecord[] = await queryClient.fetchQuery({
    queryKey: ['/', 'metaEvaluations'],
    queryFn: () => fetchEvaluationsAll({ Context }),
  });

  if (!evaluationsAll) {
    throw new Error('Evaluations not found');
  }

  const newEvaluationRecordsList = evaluationsAll;

  switch (Action) {
    case 'Import': {
      for (const evaluation of RelevantRecords ?? []) {
        const newEntry = await DuplicateEvaluationRecord(Context, Group, Individual, evaluation);

        newEvaluationRecordsList.push(newEntry);
      }

      break;
    }
  }

  return newEvaluationRecordsList;
};
