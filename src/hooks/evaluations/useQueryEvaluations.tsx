import { FolderHandleContext } from '@/context/folder-context';
import { useContext, useEffect, useState } from 'react';
import { pullEvaluationFolders } from './helpers/pull-evaluation-folders';
import { QueryResponseEvaluationsExpanded } from './types/query-response-type-evaluations';
import { CleanUpString } from '@/lib/strings';
import { displayConditionalNotification } from '@/lib/notifications';
import { removeEvaluationFolder } from './helpers/remove-evaluation-folder';

export default function useQueryEvaluations(Group?: string, Client?: string) {
  const { handle, settings } = useContext(FolderHandleContext);
  const [version, setVersion] = useState(0);

  const [data, setData] = useState<QueryResponseEvaluationsExpanded>({
    status: 'loading',
    data: [],
    handle,
  });

  const incrementVersion = () => setVersion((prev) => prev + 1);

  const addEvaluation = async () => {
    if (!handle || !Group || !Client) return;

    const input = window.prompt('Enter a name for the new evaluation.');

    if (!input || !handle) return;

    if (data.data.includes(input)) {
      alert('Evaluation already exists.');
      return;
    }

    if (input.trim().length < 4) {
      alert('Evaluation name must be at least 4 characters long.');
      return;
    }

    const group_dir = await handle.getDirectoryHandle(CleanUpString(Group));
    const client_dir = await group_dir.getDirectoryHandle(CleanUpString(Client));
    await client_dir.getDirectoryHandle(input, { create: true });

    displayConditionalNotification(
      settings,
      'New Evaluation Created',
      'A folder for the new evaluation has been created.'
    );

    incrementVersion();
  };

  const removeEvaluation = async (evaluation: string) => {
    const confirm_delete = window.confirm('Are you sure you want to delete this evaluation?. This CANNOT be undone.');

    if (confirm_delete && handle && Group && Client) {
      try {
        await removeEvaluationFolder(handle, Group, Client, evaluation);

        displayConditionalNotification(
          settings,
          'Evaluation Data Deleted',
          'Evaluation data has been successfully deleted.'
        );

        incrementVersion();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        displayConditionalNotification(
          settings,
          'Evaluation Data Deletion Error',
          'An error occurred while deleting the evaluation data.',
          3000,
          true
        );
      }
    }
  };

  useEffect(() => {
    if (handle && Group && Client)
      pullEvaluationFolders(handle, Group, Client).then((response) => {
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
    addEvaluation,
    removeEvaluation,
  };
}
