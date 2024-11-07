import { FolderHandleContext } from '@/context/folder-context';
import { useContext, useEffect, useState } from 'react';
import { QueryResponseStatus } from './types/query-status';
import { CleanUpString } from '@/lib/strings';

type QueryResponseEvaluations = {
  status: QueryResponseStatus;
  data: string[];
  error?: string;
};

type QueryResponseEvaluationsExpanded = QueryResponseEvaluations & {
  handle?: FileSystemDirectoryHandle;
};

const getEvaluationFolders = async (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Client: string
): Promise<QueryResponseEvaluations> => {
  try {
    const group_folder = await Handle.getDirectoryHandle(CleanUpString(Group));
    const individual_folder = await group_folder.getDirectoryHandle(CleanUpString(Client));
    const entries = await individual_folder.values();

    const temp_evaluation_folders = [] as string[];

    for await (const entry of entries) {
      if (entry.name === '.DS_Store') continue;

      if (entry.kind === 'directory') temp_evaluation_folders.push(entry.name);
    }

    return {
      status: 'success',
      data: temp_evaluation_folders,
    };
  } catch (error) {
    return {
      status: 'error',
      data: [],
      error: error as string,
    };
  }
};

export default function useQueryEvaluations(Group?: string, Client?: string) {
  const { handle } = useContext(FolderHandleContext);
  const [version, setVersion] = useState(0);

  const [data, setData] = useState<QueryResponseEvaluationsExpanded>({
    status: 'loading',
    data: [],
    handle,
  });

  const incrementVersion = () => setVersion((prev) => prev + 1);

  useEffect(() => {
    if (handle && Group && Client)
      getEvaluationFolders(handle, Group, Client).then((response) => {
        setData(response);
      });
    else setData({ status: 'error', data: [], error: 'No handle found' });

    return () => {};
  }, [handle, Group, Client, version]);

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
