import { FolderHandleContextType } from '@/context/folder-context';
import { useEffect, useState } from 'react';
import { CleanUpString } from '@/lib/strings';
import { displayConditionalNotification } from '@/lib/notifications';
import { QueryResponseClientsExpanded } from './types/query-response-type-clients';
import { pullClientFolders } from './helpers/pull-client-folders';
import { removeClientFolder } from './helpers/remove-client-folder';

export function useQueryClientsFixed(Group: string, Context: FolderHandleContextType) {
  const { handle, settings } = Context;
  const [version, setVersion] = useState(0);

  const [data, setData] = useState<QueryResponseClientsExpanded>({
    status: 'loading',
    data: [],
    handle,
  });

  const incrementVersion = () => setVersion((prev) => prev + 1);

  const addClient = async () => {
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

    const group_dir = await handle!.getDirectoryHandle(CleanUpString(Group));
    await group_dir.getDirectoryHandle(input.trim(), { create: true });

    displayConditionalNotification(
      settings,
      'New Individual Created',
      'A folder for the new individual has been created.'
    );

    incrementVersion();
  };

  const removeClients = async (clients: string[]) => {
    const confirm_delete = window.confirm(
      `Are you sure you want to delete ${clients.length} individual(s)? This CANNOT be undone.`
    );

    if (confirm_delete && handle && Group) {
      try {
        for (const client of clients) {
          await removeClientFolder(handle, CleanUpString(Group), CleanUpString(client));
        }

        displayConditionalNotification(settings, 'Clients Deleted', 'Selected clients have been successfully deleted.');

        incrementVersion();
      } catch {
        displayConditionalNotification(
          settings,
          'Client Deletion Error',
          'An error occurred while deleting the selected clients.',
          3000,
          true
        );
      }
    }
  };

  useEffect(() => {
    pullClientFolders(handle!, Group).then((response) => {
      setData(response);
    });

    return () => {};
  }, [handle, Group, version]);

  if (data.status === 'error') {
    return {
      status: 'error',
      data: [],
      error: 'No handle found',
      refresh: incrementVersion,
      addClient,
      removeClients,
    };
  }

  return {
    status: data.status,
    data: data.data,
    error: data.error,
    handle,
    refresh: incrementVersion,
    addClient,
    removeClients,
  };
}
