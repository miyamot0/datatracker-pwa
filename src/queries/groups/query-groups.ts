export const groupQueryOptions = (Handle: FileSystemDirectoryHandle) => ({
  queryKey: ['/'],
  queryFn: () => fetchGroups(Handle),
});

const fetchGroups = async (Handle: FileSystemDirectoryHandle) => {
  try {
    const entries = await Handle.values();
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
