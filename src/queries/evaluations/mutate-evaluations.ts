import { FolderHandleContextType } from '@/context/folder-context';
import { CleanUpString } from '@/lib/strings';
import { fetchEvaluations } from './query-evaluations';
import { queryClient } from '@/context/query-client';

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

export const mutationEvaluations = async ({
  Group,
  Individual,
  Evaluations,
  Rename,
  Context,
  Action,
}: {
  Group: string;
  Individual: string;
  Evaluations: string[];
  Rename?: string;
  Context: FolderHandleContextType;
  Action: 'Add' | 'Delete' | 'Duplicate' | 'Rename';
}): Promise<string[]> => {
  const evaluations: string[] = await queryClient.fetchQuery({
    queryKey: ['/', Group],
    queryFn: () => fetchEvaluations({ Context, Group, Individual }),
  });

  if (!evaluations) {
    throw new Error('Evaluations not found');
  }

  let newEvaluationsList = evaluations;

  const group_dir = await Context.handle!.getDirectoryHandle(CleanUpString(Group));
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
