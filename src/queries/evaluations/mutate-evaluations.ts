import { CleanUpString } from '@/lib/strings';
import { evaluationQueryOptions } from './query-evaluations';
import { queryClient } from '@/App';

/**
 * This function is responsible for mutating the evaluations associated with a specific group and individual. It takes in the necessary parameters to identify the target evaluations and the action to be performed (in this case, importing evaluations). The function first retrieves the current list of evaluations using React Query's `fetchQuery` method. It then performs the specified action by iterating over the relevant evaluation records and duplicating them in the file system using the provided directory handle. Finally, it returns the updated list of evaluation records after the mutation is complete.
 *
 * @param individual_dir - The file system directory handle for the individual whose evaluations are being mutated.
 * @param Evaluations - An array of evaluation names that are relevant to the mutation action (in this case, the evaluations to be imported).
 * @param Rename - An optional string representing the new name for the duplicated evaluation (required for duplication and renaming actions).
 * @returns - A promise that resolves to the updated list of evaluation records after the mutation is complete.
 * @throws - An error if the evaluations cannot be found or if the required parameters for duplication and renaming actions are not provided.
 */
const copyDirectory = async (individual_dir: FileSystemDirectoryHandle, Evaluations: string[], Rename: string) => {
  const oldEvaluationDir = await individual_dir.getDirectoryHandle(Evaluations[0]);
  const newEvaluationDir = await individual_dir.getDirectoryHandle(Rename, { create: true });

  for await (const item of oldEvaluationDir.values()) {
    if (item.kind === 'file') {
      const file = await oldEvaluationDir.getFileHandle(item.name);
      const new_file = await newEvaluationDir.getFileHandle(item.name, { create: true });
      const file_data = await file.getFile();
      const writable = await new_file.createWritable();
      await writable.write(file_data);
      await writable.close();
    } else if (item.kind === 'directory') {
      const old_sub_dir = await oldEvaluationDir.getDirectoryHandle(item.name);
      const new_sub_dir = await newEvaluationDir.getDirectoryHandle(item.name, { create: true });
      for await (const sub_item of old_sub_dir.values()) {
        if (sub_item.kind === 'file') {
          const file = await old_sub_dir.getFileHandle(sub_item.name);
          const new_file = await new_sub_dir.getFileHandle(sub_item.name, { create: true });
          const file_data = await file.getFile();
          const writable = await new_file.createWritable();
          await writable.write(file_data);
          await writable.close();
        }
      }
    }
  }
};

/**
 * This function is responsible for mutating the evaluations associated with a specific group and individual. It takes in the necessary parameters to identify the target evaluations and the action to be performed (in this case, adding, deleting, duplicating, or renaming evaluations). The function first retrieves the current list of evaluations using React Query's `fetchQuery` method. It then performs the specified action by interacting with the file system through the provided directory handle. Finally, it returns the updated list of evaluation names after the mutation is complete.
 *
 * @param Group - The name of the group associated with the evaluations.
 * @param Individual - The name of the individual associated with the evaluations.
 * @param Evaluations - An array of evaluation names that are relevant to the mutation action (in this case, the evaluations to be added, deleted, duplicated, or renamed).
 * @param Rename - An optional string representing the new name for the duplicated or renamed evaluation (required for duplication and renaming actions).
 * @param Handle - The file system directory handle used to access and manipulate the evaluation records.
 * @param Action - The action to be performed on the evaluations (in this case, 'Add', 'Delete', 'Duplicate', or 'Rename').
 * @returns - A promise that resolves to the updated list of evaluation names after the mutation is complete.
 */
export const mutationEvaluations = async ({
  Group,
  Individual,
  Evaluations,
  Rename,
  Handle,
  Action,
}: {
  Group: string;
  Individual: string;
  Evaluations: string[];
  Rename?: string;
  Handle: FileSystemDirectoryHandle;
  Action: 'Add' | 'Delete' | 'Duplicate' | 'Rename';
}): Promise<string[]> => {
  const evaluations: string[] = await queryClient.fetchQuery(evaluationQueryOptions(Handle, Group, Individual));

  if (!evaluations) {
    throw new Error('Evaluations not found');
  }

  let newEvaluationsList = evaluations;

  const group_dir = await Handle.getDirectoryHandle(CleanUpString(Group));
  const individual_dir = await group_dir.getDirectoryHandle(Individual);

  switch (Action) {
    case 'Add':
      await individual_dir.getDirectoryHandle(Evaluations[0], { create: true });
      newEvaluationsList.push(Evaluations[0]);

      break;
    case 'Delete':
      for (let i = 0; i < Evaluations.length; i++) {
        const individualEvaluation = Evaluations[i];

        await individual_dir.removeEntry(individualEvaluation, {
          recursive: true,
        });

        newEvaluationsList = newEvaluationsList.filter((e) => e != individualEvaluation);
      }

      break;
    case 'Duplicate': {
      if (!Rename) throw new Error('Rename is required for duplication');

      await copyDirectory(individual_dir, Evaluations, Rename);

      // Push new renamed evaluation to list
      newEvaluationsList.push(Rename);

      break;
    }
    case 'Rename': {
      if (!Rename) throw new Error('Rename is required for renaming');

      await copyDirectory(individual_dir, Evaluations, Rename);

      // Delete prior name
      await individual_dir.removeEntry(Evaluations[0], { recursive: true });

      // Rename entry
      newEvaluationsList = newEvaluationsList.map((e) => (e === Evaluations[0] ? Rename : e));

      break;
    }
  }

  return newEvaluationsList;
};
