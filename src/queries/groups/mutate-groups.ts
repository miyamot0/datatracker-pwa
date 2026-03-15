import { queryClient } from '@/App';
import { groupQueryOptions } from './query-groups';
import { DataExampleFiles } from '@/lib/data';

export const DemoDataFolderName = 'Example DataTracker Group';

/**
 * This function is responsible for copying demo data into the file system when the 'Demo' action is triggered in the `mutationGroups` function. It takes in the current list of groups and the file system directory handle as parameters. The function first checks if the demo data folder already exists to prevent overwriting existing data. If it does not exist, it creates a new directory for the demo data and iterates over the predefined example files, creating the necessary subdirectories and files in the file system based on the structure defined in the `DataExampleFiles` array. This allows users to quickly load example data into their application for testing or demonstration purposes.
 *
 * @param Groups - The current list of groups in the application.
 * @param Handle - The file system directory handle used to access and manipulate the group records.
 */
const copyDemoData = async (Groups: string[], Handle: FileSystemDirectoryHandle) => {
  if (Groups.includes(DemoDataFolderName)) {
    alert(`The ${DemoDataFolderName} folder already exists. Delete it if you'd like to re-load example data.`);

    throw new Error(`${DemoDataFolderName} already exists`);
  }

  const folder = await Handle.getDirectoryHandle(DemoDataFolderName, { create: true });

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

/**
 * This function is responsible for mutating the groups within the application. It takes in the necessary parameters to identify the target group and the action to be performed (adding, deleting, or loading demo data). The function first retrieves the current list of groups using React Query's `fetchQuery` method. It then performs the specified action by interacting with the file system through the provided directory handle. Finally, it returns the updated list of groups after the mutation is complete.
 *
 * @param Group - An array containing the name of the group to be mutated (in this case, the group to be added or deleted).
 * @param Handle - The file system directory handle used to access and manipulate the group records.
 * @param Action - The action to be performed on the groups (in this case, 'Add', 'Delete', or 'Demo').
 * @returns - A promise that resolves to the updated list of groups after the mutation is complete.
 */
export const mutationGroups = async ({
  Group,
  Handle,
  Action,
}: {
  Group: string[];
  Handle: FileSystemDirectoryHandle;
  Action: 'Add' | 'Delete' | 'Demo';
}): Promise<string[]> => {
  const groups: string[] = await queryClient.fetchQuery(groupQueryOptions(Handle));

  if (!groups) {
    throw new Error('Groups not found');
  }

  let newGroups = groups;

  if (Action == 'Add') {
    await Handle.getDirectoryHandle(Group[0], { create: true });
    newGroups.push(Group[0]);
  } else if (Action == 'Delete') {
    await Handle.removeEntry(Group[0], { recursive: true });
    newGroups = newGroups.filter((g) => g != Group[0]);
  } else if (Action == 'Demo') {
    await copyDemoData(newGroups, Handle);

    newGroups.push(DemoDataFolderName);
  }

  return newGroups;
};
