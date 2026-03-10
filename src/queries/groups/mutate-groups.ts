import { fetchGroups } from './query-groups';
import { FolderHandleContextType } from '@/context/folder-context';
import { queryClient } from '@/context/query-client';
import { DataExampleFiles } from '@/lib/data';

export const DemoDataFolderName = 'Example DataTracker Group';

export const mutationGroups = async ({
  Group,
  Context,
  Action,
}: {
  Group: string[];
  Context: FolderHandleContextType;
  Action: 'Add' | 'Delete' | 'Demo';
}): Promise<string[]> => {
  const groups: string[] = await queryClient.fetchQuery({
    queryKey: ['/'],
    queryFn: () => fetchGroups(Context),
  });

  if (!groups) {
    throw new Error('Groups not found');
  }

  let newGroups = groups;

  if (Action == 'Add') {
    await Context.handle!.getDirectoryHandle(Group[0], { create: true });
    newGroups.push(Group[0]);
  } else if (Action == 'Delete') {
    await Context.handle!.removeEntry(Group[0], { recursive: true });
    newGroups = newGroups.filter((g) => g != Group[0]);
  } else if (Action == 'Demo') {
    await copyDemoData(newGroups, Context);

    newGroups.push(DemoDataFolderName);
  }

  return newGroups;
};

const copyDemoData = async (Groups: string[], Context: FolderHandleContextType) => {
  const { handle } = Context;

  if (Groups.includes(DemoDataFolderName)) {
    alert(`The ${DemoDataFolderName} folder already exists. Delete it if you'd like to re-load example data.`);

    throw new Error(`${DemoDataFolderName} already exists`);
  }

  const folder = await handle!.getDirectoryHandle(DemoDataFolderName, { create: true });

  for (const file of DataExampleFiles) {
    const participantId = file.path[0];
    const participantFolder = await folder.getDirectoryHandle(participantId, { create: true });

    let subfolderHandle = participantFolder;

    // Note: Tunnel down to final subfolder
    for (let i = 1; i <= file.path.length - 1; i++) {
      const subfolder = file.path[i];
      subfolderHandle = await subfolderHandle.getDirectoryHandle(subfolder, { create: true });
    }

    const fileHandle = await subfolderHandle.getFileHandle(file.filename!, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file.text);
    await writable.close();
  }
};
