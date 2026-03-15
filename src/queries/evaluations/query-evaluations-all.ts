import { EvaluationRecord } from '../keysets/mutate-keyboards';

/**
 * Queries all evaluations by accessing the file system and retrieving the relevant information about groups, individuals, evaluations, and their associated conditions. It returns an array of EvaluationRecord objects that contain the details of each evaluation found within the file system structure, or an empty array if no evaluations are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @returns A promise that resolves to an array of EvaluationRecord objects containing the details of each evaluation found, or an empty array if no evaluations are found or if there is an error during the file system operations.
 */
export const evaluationsAllQueryOptions = (Handle: FileSystemDirectoryHandle) => ({
  queryKey: ['/', 'metaEvaluations'],
  queryFn: () => fetchEvaluationsAll({ Handle }),
});

/**
 * Fetches all evaluations by accessing the file system and retrieving the relevant information about groups, individuals, evaluations, and their associated conditions. It returns an array of EvaluationRecord objects that contain the details of each evaluation found within the file system structure, or an empty array if no evaluations are found or if there is an error during the file system operations.
 * @param Handle - The file system directory handle for accessing the storage.
 * @returns A promise that resolves to an array of EvaluationRecord objects containing the details of each evaluation found, or an empty array if no evaluations are found or if there is an error during the file system operations.
 */
const fetchEvaluationsAll = async ({ Handle }: { Handle: FileSystemDirectoryHandle }) => {
  try {
    const temp_evaluation_folders = [] as EvaluationRecord[];

    const dataTrackHighLevelEntries = await Handle.values();

    for await (const possibleGroupFolder of dataTrackHighLevelEntries) {
      if (possibleGroupFolder.name === '.DS_Store') continue;

      if (possibleGroupFolder.kind === 'directory') {
        // Note: This is for the Group folder
        const actualGroupFolderHandle = await Handle.getDirectoryHandle(possibleGroupFolder.name);
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
