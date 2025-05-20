import { FolderHandleContextType } from '@/context/folder-context';
import { useEffect, useState } from 'react';
import { displayConditionalNotification } from '@/lib/notifications';
import { QueryResponseGroupsExpanded } from './types/query-response-type-groups';
import { pullGroupFolders } from './helpers/pull-group-folders';
import { removeGroupFolder } from './helpers/remove-group-folder';

export function useQueryGroupsFixed(Context: FolderHandleContextType) {
  const { handle, settings } = Context;
  const [version, setVersion] = useState(0);

  const [data, setData] = useState<QueryResponseGroupsExpanded>({
    status: 'loading',
    data: [],
    handle,
  });

  const incrementVersion = () => setVersion((prev) => prev + 1);

  const addGroup = async () => {
    const input = window.prompt('Enter a name for the new group.');

    if (!input) return;

    if (data.data.includes(input)) {
      alert('Group already exists.');
      return;
    }

    if (input.trim().length < 4) {
      alert('Group name must be at least 4 characters long.');
      return;
    }

    await handle!.getDirectoryHandle(input, { create: true });

    displayConditionalNotification(settings, 'Folder Created', 'The new Group folder has been successfully created.');

    incrementVersion();
  };

  const removeGroup = async (Group: string) => {
    const confirm_delete = window.confirm('Are you sure you want to delete this group?. This CANNOT be undone.');

    if (confirm_delete) {
      try {
        await removeGroupFolder(handle!, Group);

        displayConditionalNotification(settings, 'Group Data Deleted', 'Group data has been successfully deleted.');

        incrementVersion();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error: unknown) {
        displayConditionalNotification(
          settings,
          'Error Deleting Group Data',
          'An error occurred while trying to delete the group folder.',
          3000,
          true
        );
      }
    }
  };

  useEffect(() => {
    pullGroupFolders(handle!).then((response) => {
      setData(response);
    });

    return () => {};
  }, [handle, version]);

  if (data.status === 'error') {
    return {
      status: 'error',
      data: [],
      error: 'No handle found',
      refresh: incrementVersion,
      addGroup,
      removeGroup,
    };
  }

  return {
    status: data.status,
    data: data.data,
    error: data.error,
    refresh: incrementVersion,
    addGroup,
    removeGroup,
  };
}
