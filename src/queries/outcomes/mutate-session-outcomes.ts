import { CleanUpString } from '@/lib/strings';
import { sessionOutcomesQueryOptions } from './query-session-outcomes';
import { ModifiedSessionResult } from '@/types/storage';
import { GenerateSavedFileName } from '@/lib/writer';
import { queryClient } from '@/App';
import { SavedSessionResult } from '@/lib/dtos';

const DeleteSessions = async (
  cleanedOutcomes: ModifiedSessionResult[],
  Outcomes: ModifiedSessionResult[],
  evaluation_dir: FileSystemDirectoryHandle,
): Promise<ModifiedSessionResult[]> => {
  let modifiedArray = cleanedOutcomes;

  for (const outcome of Outcomes) {
    const condition_dir = await evaluation_dir
      .getDirectoryHandle(outcome.SessionSettings.Condition, { create: false })
      .catch(() => null);

    if (condition_dir) {
      await condition_dir.removeEntry(outcome.Filename).catch(() => null);

      modifiedArray = modifiedArray.filter((row) => row.Filename !== outcome.Filename);
    }
  }

  return modifiedArray;
};

const CopyAndRenameSessions = async (
  cleanedOutcomes: ModifiedSessionResult[],
  Outcomes: ModifiedSessionResult[],
  NewCondition: string,
  evaluation_dir: FileSystemDirectoryHandle,
): Promise<ModifiedSessionResult[]> => {
  const newConditionFolderHandle = await evaluation_dir.getDirectoryHandle(NewCondition.trim(), {
    create: true,
  });

  const file_names_to_move = Outcomes.map((row) => row.Filename);

  const new_session_files: ModifiedSessionResult[] = [];

  for await (const filename of await evaluation_dir.values()) {
    if (filename.kind === 'directory') {
      const condition_folder = await evaluation_dir.getDirectoryHandle(filename.name);

      for await (const sub_dir_file of await condition_folder.values()) {
        if (file_names_to_move.includes(sub_dir_file.name)) {
          const relevant_result = Outcomes.find((r) => r.Filename === sub_dir_file.name);

          if (!relevant_result) continue;

          const new_object = { ...relevant_result };
          new_object.SessionSettings.Condition = NewCondition.trim();

          const new_file_name = GenerateSavedFileName(new_object.SessionSettings);
          const new_file_handle = await newConditionFolderHandle.getFileHandle(new_file_name, {
            create: true,
          });

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { Filename, ...ModifiedResult } = relevant_result;

          const writer = await new_file_handle.createWritable();
          await writer.write(JSON.stringify(ModifiedResult));
          await writer.close();

          const file_to_add = { ...new_object, Filename: new_file_name };
          new_session_files.push(file_to_add);

          await condition_folder.removeEntry(sub_dir_file.name);
        }
      }
    }
  }

  const updatedOutcomes = cleanedOutcomes
    .filter((r) => !file_names_to_move.includes(r.Filename))
    .concat(new_session_files)
    .sort((a, b) => new Date(b.SessionSettings.Session).valueOf() - new Date(a.SessionSettings.Session).valueOf());

  return updatedOutcomes;
};

export const mutationSettingsOutcomes = async ({
  Group,
  Individual,
  Evaluation,
  Outcomes,
  ConditionRename,
  UpdatedOutcome,
  PriorOutcome,
  NewOutcome,
  Handle,
  Action,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  Outcomes: ModifiedSessionResult[];
  ConditionRename?: string;
  UpdatedOutcome?: ModifiedSessionResult;
  PriorOutcome?: ModifiedSessionResult;
  NewOutcome?: SavedSessionResult;
  Handle: FileSystemDirectoryHandle;
  Action: 'Delete' | 'EditCondition' | 'Modify' | 'Add';
}): Promise<ModifiedSessionResult[]> => {
  const sessionOutcomes: ModifiedSessionResult[] = await queryClient.fetchQuery(
    sessionOutcomesQueryOptions(Handle, Group, Individual, Evaluation),
  );

  if (!sessionOutcomes) {
    throw new Error('Outcomes not found');
  }

  const group_dir = await Handle.getDirectoryHandle(CleanUpString(Group));
  const individual_dir = await group_dir.getDirectoryHandle(Individual);
  const evaluation_dir = await individual_dir.getDirectoryHandle(Evaluation);

  let cleanedSessionOutcomes: ModifiedSessionResult[] = sessionOutcomes;

  switch (Action) {
    case 'Delete': {
      cleanedSessionOutcomes = await DeleteSessions(cleanedSessionOutcomes, Outcomes, evaluation_dir);

      break;
    }
    case 'EditCondition': {
      if (!ConditionRename) throw new Error('Condition rename value not provided');

      cleanedSessionOutcomes = await CopyAndRenameSessions(
        cleanedSessionOutcomes,
        Outcomes,
        ConditionRename,
        evaluation_dir,
      );
      break;
    }
    case 'Modify': {
      if (!UpdatedOutcome || !PriorOutcome) {
        throw new Error('Updated outcome not found');
      }

      const indexOfOutcome = sessionOutcomes.indexOf(PriorOutcome);

      if (indexOfOutcome == -1) {
        throw new Error('Original outcome not found');
      }

      try {
        const condition_dir = await evaluation_dir.getDirectoryHandle(
          CleanUpString(UpdatedOutcome.SessionSettings.Condition),
          {
            create: true,
          },
        );

        const session_output_file = await condition_dir.getFileHandle(PriorOutcome.Filename, {
          create: false,
        });

        const writer = await session_output_file.createWritable();
        await writer.write(JSON.stringify(UpdatedOutcome));
        await writer.close();

        cleanedSessionOutcomes[indexOfOutcome] = UpdatedOutcome;
      } catch (error: unknown) {
        new Error(`Failed to update outcome: ${error}`);
      }

      break;
    }
    case 'Add': {
      if (!NewOutcome) {
        throw new Error('New outcome not found');
      }

      const Filename = GenerateSavedFileName(NewOutcome.SessionSettings);

      const savedResult = {
        ...NewOutcome,
        Filename,
      } satisfies ModifiedSessionResult;

      try {
        const condition_dir = await evaluation_dir.getDirectoryHandle(
          CleanUpString(NewOutcome.SessionSettings.Condition),
          {
            create: true,
          },
        );

        const session_output_file = await condition_dir.getFileHandle(savedResult.Filename, {
          create: true,
        });

        const writer = await session_output_file.createWritable();
        await writer.write(JSON.stringify(savedResult));
        await writer.close();

        cleanedSessionOutcomes.unshift(savedResult);
      } catch (error: unknown) {
        new Error(`Failed to add outcome: ${error}`);
      }

      break;
    }
  }

  return cleanedSessionOutcomes;
};
