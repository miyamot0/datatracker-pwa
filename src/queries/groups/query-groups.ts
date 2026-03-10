import { FolderHandleContextType } from '@/context/folder-context';

export const fetchGroups = async (Context: FolderHandleContextType) => {
  const { handle } = Context;

  try {
    const entries = await handle!.values();
    const temp_group_folders = [] as string[];

    for await (const entry of entries) {
      if (entry.kind === 'directory' && entry.name !== '.DS_Store') {
        temp_group_folders.push(entry.name);
      }
    }

    return temp_group_folders;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return [];
  }
};
