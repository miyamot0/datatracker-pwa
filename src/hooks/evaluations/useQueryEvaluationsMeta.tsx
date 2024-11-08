import { FolderHandleContext } from '@/context/folder-context';
import { useContext, useEffect, useState } from 'react';
import { QueryResponseEvaluationsMetaExpanded } from './types/query-response-type-evaluations';
import { pullAllEvaluationFolders } from './helpers/pull-all-evaluation-folders';

export default function useQueryEvaluationsMeta(Group?: string, Client?: string) {
  const { handle } = useContext(FolderHandleContext);
  const [version, setVersion] = useState(0);

  const [data, setData] = useState<QueryResponseEvaluationsMetaExpanded>({
    status: 'loading',
    data: [],
    handle,
  });

  const incrementVersion = () => setVersion((prev) => prev + 1);

  useEffect(() => {
    if (handle && Group && Client)
      pullAllEvaluationFolders(handle).then((response) => {
        console.log(response);
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
      handle,
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
