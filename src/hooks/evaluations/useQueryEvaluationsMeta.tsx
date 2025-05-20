import { FolderHandleContext, FolderHandleContextType } from '@/context/folder-context';
import { useContext, useEffect, useState } from 'react';
import { EvaluationRecord, QueryResponseEvaluationsMetaExpanded } from './types/query-response-type-evaluations';
import { pullAllEvaluationFolders } from './helpers/pull-all-evaluation-folders';
import { toast } from 'sonner';

/**
 * Deprecated. Use `useQueryEvaluationsMetaFixed` instead.
 *
 * @param Group
 * @param Client
 * @returns
 */
export default function useQueryEvaluationsMeta(Group?: string, Client?: string) {
  const { handle } = useContext(FolderHandleContext);
  const [version, setVersion] = useState(0);

  const [data, setData] = useState<QueryResponseEvaluationsMetaExpanded>({
    status: 'loading',
    data: [],
    handle,
  });

  const incrementVersion = () => setVersion((prev) => prev + 1);

  const addEvaluationFolder = async (evaluation: EvaluationRecord) => {
    if (handle && Group && Client) {
      const g_folder = await handle.getDirectoryHandle(Group);
      const i_folder = await g_folder.getDirectoryHandle(Client);
      const e_folder = await i_folder.getDirectoryHandle(evaluation.Evaluation, { create: true });

      for (const condition of evaluation.Conditions) {
        await e_folder.getDirectoryHandle(condition, { create: true });
      }
    }

    toast.success('Evaluation successfully imported.');

    incrementVersion();
  };

  useEffect(() => {
    if (handle && Group && Client) {
      pullAllEvaluationFolders(handle).then((response) => {
        setData(response);
      });
    } else {
      setData({ status: 'error', data: [], error: 'No handle found' });
    }

    return () => {};
  }, [handle, Group, Client, version]);

  if (data.status === 'error') {
    return {
      status: 'error',
      data: data.data,
      error: 'No handle found',
      handle,
      refresh: incrementVersion,
      addEvaluationFolder,
    };
  }

  return {
    status: data.status,
    data: data.data,
    error: data.error,
    handle,
    refresh: incrementVersion,
    addEvaluationFolder,
  };
}

export function useQueryEvaluationsMetaFixed(Group: string, Client: string, Context: FolderHandleContextType) {
  const { handle } = Context;
  const [version, setVersion] = useState(0);

  const [data, setData] = useState<QueryResponseEvaluationsMetaExpanded>({
    status: 'loading',
    data: [],
    handle,
  });

  const incrementVersion = () => setVersion((prev) => prev + 1);

  const addEvaluationFolder = async (evaluation: EvaluationRecord) => {
    const g_folder = await handle!.getDirectoryHandle(Group);
    const i_folder = await g_folder.getDirectoryHandle(Client);
    const e_folder = await i_folder.getDirectoryHandle(evaluation.Evaluation, { create: true });

    for (const condition of evaluation.Conditions) {
      await e_folder.getDirectoryHandle(condition, { create: true });
    }

    toast.success('Evaluation successfully imported.');

    incrementVersion();
  };

  useEffect(() => {
    pullAllEvaluationFolders(handle!).then((response) => {
      setData(response);
    });

    return () => {};
  }, [handle, Group, Client, version]);

  if (data.status === 'error') {
    return {
      status: 'error',
      data: data.data,
      error: 'No handle found',
      handle,
      refresh: incrementVersion,
      addEvaluationFolder,
    };
  }

  return {
    status: data.status,
    data: data.data,
    error: data.error,
    handle,
    refresh: incrementVersion,
    addEvaluationFolder,
  };
}
