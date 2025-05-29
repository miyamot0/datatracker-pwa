import { FolderHandleContextType } from '@/context/folder-context';
import { useEffect, useState } from 'react';
import { displayConditionalNotification } from '@/lib/notifications';
import { QueryResponseGroupsExpanded } from './types/query-response-type-groups';
import { pullGroupFolders } from './helpers/pull-group-folders';
import { removeGroupFolder } from './helpers/remove-group-folder';
import { DataExampleFiles } from '@/lib/data';

// eslint-disable-next-line react-refresh/only-export-components
const DemoDataFolderName = 'Example DataTracker Group';

export function useQueryGroupsFixed(Context: FolderHandleContextType) {
  const { handle, settings } = Context;
  const [version, setVersion] = useState(0);

  const [data, setData] = useState<QueryResponseGroupsExpanded>({
    status: 'loading',
    data: [],
    handle,
  });

  const incrementVersion = () => setVersion((prev) => prev + 1);

  const copyDemoData = async () => {
    const input = window.confirm(`This will create an ${DemoDataFolderName} folder for you. Do you wish to proceed?`);

    if (!input) {
      throw new Error('Error: User cancelled action');
    }

    if (data.data.includes(DemoDataFolderName)) {
      alert(`The ${DemoDataFolderName} folder already exists. Delete it if you'd like to re-load example data.`);

      throw new Error(`${DemoDataFolderName} already exists`);
    }

    const folder = await handle!.getDirectoryHandle(DemoDataFolderName, { create: true });

    for (const file of DataExampleFiles) {
      const participantId = file.path[0];
      const participantFolder = await folder.getDirectoryHandle(participantId, { create: true });

      let subfolderHandle = participantFolder;

      // Note: Tunnel down to final subfolder
      for (let i = 1; i <= file.path.length - 1; i++) {
        const subfolder = file.path[i];
        subfolderHandle = await subfolderHandle.getDirectoryHandle(subfolder, { create: true });
      }

      const fileHandle = await subfolderHandle.getFileHandle(file.filename!, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(file.text);
      await writable.close();
    }

    incrementVersion();
  };

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

  const removeGroups = async (Groups: string[]) => {
    const confirm_delete = window.confirm(
      `Are you sure you want to delete ${Groups.length} group(s)? This CANNOT be undone.`
    );

    if (confirm_delete) {
      try {
        for (const group of Groups) {
          await removeGroupFolder(handle!, group);
        }

        incrementVersion();
      } catch {
        throw new Error('Error: User cancelled action');
      }
    } else {
      throw new Error('Error: User cancelled action');
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
      removeGroups,
      copyDemoData,
    };
  }

  return {
    status: data.status,
    data: data.data,
    error: data.error,
    refresh: incrementVersion,
    addGroup,
    removeGroups,
    copyDemoData,
  };
}
