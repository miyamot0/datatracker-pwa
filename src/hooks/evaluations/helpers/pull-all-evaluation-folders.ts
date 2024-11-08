import { EvaluationRecord, QueryResponseEvaluationsMeta } from '../types/query-response-type-evaluations';

/**
 * Pulls all evaluation folders from the provided directory handle.
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @param Client The client name
 * @returns Evaluations in the relevant directory
 */
export const pullAllEvaluationFolders = async (
  Handle: FileSystemDirectoryHandle
): Promise<QueryResponseEvaluationsMeta> => {
  try {
    const temp_evaluation_folders = [] as EvaluationRecord[];

    const group_entries = await Handle.values();

    for await (const grp_entry of group_entries) {
      if (grp_entry.name === '.DS_Store') continue;

      if (grp_entry.kind === 'directory') {
        // Note: This is for the Group folder
        const group_folder = await Handle.getDirectoryHandle(grp_entry.name);
        const individual_entries = await group_folder.values();

        for await (const indiv_entry of individual_entries) {
          if (indiv_entry.name === '.DS_Store') continue;

          if (indiv_entry.kind === 'directory') {
            // Note: This is for the Individual's folder
            const individual_folder = await group_folder.getDirectoryHandle(indiv_entry.name);
            const evaluation_entries = await individual_folder.values();

            for await (const eval_entry of evaluation_entries) {
              if (eval_entry.name === '.DS_Store') continue;

              if (eval_entry.kind === 'directory') {
                const evaluation_folder = await individual_folder.getDirectoryHandle(eval_entry.name);
                const condition_entries = await evaluation_folder.values();

                const conditions = [] as string[];

                for await (const condition_entry of condition_entries) {
                  if (condition_entry.name === '.DS_Store') continue;
                  if (condition_entry.kind === 'file') continue;

                  if (indiv_entry.kind === 'directory') {
                    conditions.push(condition_entry.name);
                  }
                }

                const eval_record = {
                  Group: grp_entry.name,
                  Individual: indiv_entry.name,
                  Evaluation: eval_entry.name,
                  Conditions: conditions,
                } satisfies EvaluationRecord;

                temp_evaluation_folders.push(eval_record);
              }
            }
          }
        }
      }
    }

    return {
      status: 'success',
      data: temp_evaluation_folders,
    };
  } catch (error) {
    return {
      status: 'error',
      data: [],
      error: error as string,
    };
  }
};
