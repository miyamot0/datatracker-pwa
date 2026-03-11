import { FolderHandleContextType } from '@/context/folder-context';
import { SavedSessionResult } from '@/lib/dtos';
import { CleanUpString } from '@/lib/strings';
import { ModifiedSessionResult } from '@/types/storage';

export const fetchSessionOutcomes = async ({
  Context,
  Group,
  Individual,
  Evaluation,
}: {
  Context: FolderHandleContextType;
  Group: string;
  Individual: string;
  Evaluation: string;
}): Promise<ModifiedSessionResult[]> => {
  const { handle } = Context;

  const group_folder = await handle!.getDirectoryHandle(CleanUpString(Group));
  const individual_folder = await group_folder.getDirectoryHandle(CleanUpString(Individual));
  const evaluations = await individual_folder.getDirectoryHandle(CleanUpString(Evaluation));

  const files: FileSystemFileHandle[] = [];

  for await (const entry of evaluations.values()) {
    if (entry.name === '.DS_Store') continue;

    if (entry.kind === 'file' && entry.name.endsWith('.json')) {
      // Skip if the session outcomes file
      if (entry.name === 'settings.json') continue;

      files.push(entry);
    } else if (entry.kind === 'directory') {
      const condition_folder = await evaluations.getDirectoryHandle(entry.name);

      for await (const condition_entry of condition_folder.values()) {
        if (condition_entry.kind === 'file' && condition_entry.name.endsWith('.json')) {
          files.push(condition_entry);
        }
      }
    }
  }

  const session_results: ModifiedSessionResult[] = [];

  for (const file of files) {
    const file_data = await file.getFile();
    const file_text = await file_data.text();

    const session_result: ModifiedSessionResult = {
      ...(JSON.parse(file_text) as SavedSessionResult),
      Filename: file.name,
    };

    if (session_result) {
      session_results.push(session_result);
    }
  }

  return session_results.sort(
    (a, b) => new Date(b.SessionSettings.Session).valueOf() - new Date(a.SessionSettings.Session).valueOf(),
  );
};
