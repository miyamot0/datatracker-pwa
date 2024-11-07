import { FolderHandleContext } from '@/context/folder-context';
import { useContext, useEffect, useState } from 'react';

type QueryResponseStatus = 'loading' | 'error' | 'success';

type QueryResponseGroups = {
  status: QueryResponseStatus;
  data: string[];
  error?: string;
};

type QueryResponseGroupsExpanded = QueryResponseGroups & {
  handle?: FileSystemDirectoryHandle;
};

const getGroupFolders = async (Handle: FileSystemDirectoryHandle): Promise<QueryResponseGroups> => {
  try {
    const entries = await Handle.values();
    const temp_group_folders = [] as string[];

    for await (const entry of entries) {
      if (entry.kind === 'directory' && entry.name !== '.DS_Store') {
        temp_group_folders.push(entry.name);
      }
    }

    return {
      status: 'success',
      data: temp_group_folders,
    };
  } catch (error) {
    return {
      status: 'error',
      data: [],
      error: error as string,
    };
  }
};

export default function useQueryGroups() {
  const { handle } = useContext(FolderHandleContext);
  const [version, setVersion] = useState(0);

  const [data, setData] = useState<QueryResponseGroupsExpanded>({
    status: 'loading',
    data: [],
    handle,
  });

  const incrementVersion = () => setVersion((prev) => prev + 1);

  useEffect(() => {
    if (handle)
      getGroupFolders(handle).then((response) => {
        setData(response);
      });

    return () => {};
  }, [handle, version]);

  if (data.status === 'error') {
    return {
      status: 'error',
      data: [],
      error: 'No handle found',
    };
  }

  return {
    status: data.status,
    data: data.data,
    error: data.error,
    handle,
    refresh: incrementVersion,
  };
}
