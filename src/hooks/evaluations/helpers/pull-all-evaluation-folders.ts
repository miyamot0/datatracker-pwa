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
                console.log(grp_entry.name);
                console.log(indiv_entry.name);
                console.log(eval_entry.name);

                const eval_record = {
                  Group: grp_entry.name,
                  Individual: indiv_entry.name,
                  Evaluation: eval_entry.name,
                  Conditions: [],
                } satisfies EvaluationRecord;

                temp_evaluation_folders.push(eval_record);

                // Note: This is for the Group folder
                //const evaluation_folder = await individual_folder.getDirectoryHandle(grp_entry.name);
                //const condition_entries = await evaluation_folder.values();

                /*
                for await (const indiv_entry of individual_entries) {
                  if (indiv_entry.name === '.DS_Store') continue;

                  if (indiv_entry.kind === 'directory') {
                    // Note: This is for the Individual's folder
                    const individual_folder = await Handle.getDirectoryHandle(indiv_entry.name);
                    const evaluation_entries = await group_folder.values();
                  }
                }
                */
              }
            }
          }
        }
      }
    }

    //temp_evaluation_folders.push(entry.name);
    /*
    const group_folder = await Handle.getDirectoryHandle(CleanUpString(Group));
    const individual_folder = await group_folder.getDirectoryHandle(CleanUpString(Client));
    const entries = await individual_folder.values();


    for await (const entry of entries) {
      if (entry.name === '.DS_Store') continue;

      if (entry.kind === 'directory') temp_evaluation_folders.push(entry.name);
    }
    */

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
