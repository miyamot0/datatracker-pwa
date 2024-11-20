import { FolderHandleContext } from '@/context/folder-context';
import { useContext, useEffect, useState } from 'react';
import { CleanUpString } from '@/lib/strings';
import { displayConditionalNotification } from '@/lib/notifications';
import { QueryResponseClientsExpanded } from './types/query-response-type-clients';
import { pullClientFolders } from './helpers/pull-client-folders';
import { removeClientFolder } from './helpers/remove-client-folder';

export default function useQueryClients(Group?: string) {
  const { handle, settings } = useContext(FolderHandleContext);
  const [version, setVersion] = useState(0);

  const [data, setData] = useState<QueryResponseClientsExpanded>({
    status: 'loading',
    data: [],
    handle,
  });

  const incrementVersion = () => setVersion((prev) => prev + 1);

  const addClient = async () => {
    if (!handle || !Group) return;

    const input = window.prompt('Enter a name for the new group.');

    if (!input) return;

    if (data.data.includes(input)) {
      window.alert('Client already exists.');
      return;
    }

    if (input.trim().length < 4) {
      window.alert('Client name must be at least 4 characters long.');
      return;
    }

    const group_dir = await handle.getDirectoryHandle(CleanUpString(Group));
    await group_dir.getDirectoryHandle(input.trim(), { create: true });

    displayConditionalNotification(
      settings,
      'New Individual Created',
      'A folder for the new individual has been created.'
    );

    incrementVersion();
  };

  const removeClient = async (client: string) => {
    const confirm_delete = window.confirm('Are you sure you want to delete this client? This CANNOT be undone.');

    if (confirm_delete && handle && Group) {
      try {
        await removeClientFolder(handle, CleanUpString(Group), CleanUpString(client));

        displayConditionalNotification(settings, 'Client Data Deleted', 'Client data has been successfully deleted.');

        incrementVersion();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error: unknown) {
        displayConditionalNotification(
          settings,
          'Client Data Deletion Error',
          'An error occurred while deleting the client data.',
          3000,
          true
        );
      }
    }
  };

  useEffect(() => {
    if (handle && Group)
      pullClientFolders(handle, Group).then((response) => {
        setData(response);
      });
    else setData({ status: 'error', data: [], error: 'No handle found' });

    return () => {};
  }, [handle, Group, version]);

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
    addClient,
    removeClient,
  };
}
