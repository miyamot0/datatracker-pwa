import { FolderHandleContextType } from '@/context/folder-context';
import { EvaluationRecord } from '../keysets/mutate-keyboards';

export const fetchEvaluationsAll = async ({ Context }: { Context: FolderHandleContextType }) => {
  const { handle } = Context;

  try {
    const temp_evaluation_folders = [] as EvaluationRecord[];

    const dataTrackHighLevelEntries = await handle!.values();

    for await (const possibleGroupFolder of dataTrackHighLevelEntries) {
      if (possibleGroupFolder.name === '.DS_Store') continue;

      if (possibleGroupFolder.kind === 'directory') {
        // Note: This is for the Group folder
        const actualGroupFolderHandle = await handle!.getDirectoryHandle(possibleGroupFolder.name);
        const individual_entries = await actualGroupFolderHandle.values();

        for await (const possibleIndividualFolder of individual_entries) {
          if (possibleIndividualFolder.name === '.DS_Store') continue;

          if (possibleIndividualFolder.kind === 'directory') {
            // Note: This is for the Individual's folder
            const actualIndividualFolderHandle = await actualGroupFolderHandle.getDirectoryHandle(
              possibleIndividualFolder.name,
            );
            const evaluation_entries = await actualIndividualFolderHandle.values();

            for await (const possibleEvaluationFolder of evaluation_entries) {
              if (possibleEvaluationFolder.name === '.DS_Store') continue;

              if (possibleEvaluationFolder.kind === 'directory') {
                const actualEvaluationFolderHandle = await actualIndividualFolderHandle.getDirectoryHandle(
                  possibleEvaluationFolder.name,
                );
                const condition_entries = await actualEvaluationFolderHandle.values();

                const conditions = [] as string[];

                for await (const condition_entry of condition_entries) {
                  if (condition_entry.name === '.DS_Store') continue;
                  if (condition_entry.kind === 'file') continue;

                  if (possibleIndividualFolder.kind === 'directory') {
                    conditions.push(condition_entry.name);
                  }
                }

                const eval_record = {
                  Group: possibleGroupFolder.name,
                  Individual: possibleIndividualFolder.name,
                  Evaluation: possibleEvaluationFolder.name,
                  Conditions: conditions,
                } satisfies EvaluationRecord;

                temp_evaluation_folders.push(eval_record);
              }
            }
          }
        }
      }
    }

    return temp_evaluation_folders;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return [];
  }
};
