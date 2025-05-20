import { FolderHandleContextType } from '@/context/folder-context';
import { useEffect, useState } from 'react';
import { QueryResponseKeyboardsExpanded } from './types/query-response-type-keyboards';
import { pullClientKeyboards } from './helpers/pull-client-keyboards';
import { createNewKeySet, serializeKeySet } from '@/lib/keyset';
import { displayConditionalNotification } from '@/lib/notifications';
import { CleanUpString } from '@/lib/strings';
import { KeySet } from '@/types/keyset';
import { v4 as uuidv4 } from 'uuid';

export function useQueryKeyboardsFixed(Group: string, Client: string, Context: FolderHandleContextType) {
  const { handle, settings } = Context;
  const [version, setVersion] = useState(0);

  const [data, setData] = useState<QueryResponseKeyboardsExpanded>({
    status: 'loading',
    data: [],
  });

  const incrementVersion = () => setVersion((prev) => prev + 1);

  const addKeyboard = async () => {
    const new_keyset_name = window && window.prompt('Enter the name of the keyset');

    if (!new_keyset_name) return;

    if (new_keyset_name.trim().length < 4) {
      window.alert('Keyset name must be at least 4 characters long');
      return;
    }

    const individuals_folder = await handle!.getDirectoryHandle(CleanUpString(Group), { create: true });
    const keyboards_folder = await individuals_folder.getDirectoryHandle(CleanUpString(Client), {
      create: true,
    });

    let keyboard_exists = false;

    const entries = await keyboards_folder.values();
    for await (const entry of entries) {
      if (entry.name === `${new_keyset_name}.json`) {
        keyboard_exists = true;
        break;
      }
    }

    if (keyboard_exists) {
      window.alert('Keyset already exists');
      return;
    }

    const key_set = createNewKeySet(new_keyset_name);

    const key_board = await keyboards_folder.getFileHandle(`${new_keyset_name}.json`, { create: true });

    const writer = await key_board.createWritable();
    await writer.write(serializeKeySet(key_set));
    await writer.close();

    displayConditionalNotification(settings, 'New Keyset Created', 'A new keyset has been created.');

    incrementVersion();
  };

  const duplicateKeyboard = async (keyset: KeySet) => {
    const new_keyset_name = window && window.prompt('Enter the name for the duplicated keyset:');

    if (!new_keyset_name) return;

    if (new_keyset_name.trim().length < 4) {
      window.alert('Keyset name must be at least 4 characters long');
      return;
    }

    const individuals_folder = await handle!.getDirectoryHandle(CleanUpString(Group), { create: true });
    const keyboards_folder = await individuals_folder.getDirectoryHandle(CleanUpString(Client), {
      create: true,
    });

    let keyboard_exists = false;

    const entries = await keyboards_folder.values();
    for await (const entry of entries) {
      if (entry.name === `${new_keyset_name}.json`) {
        keyboard_exists = true;
        break;
      }
    }

    if (keyboard_exists) {
      window.alert('Keyset with this name already exists!');
      return;
    }

    const key_set = {
      ...keyset,
      Name: new_keyset_name,
      id: uuidv4(),
      createdAt: new Date(),
      lastModified: new Date(),
    };

    const key_board = await keyboards_folder.getFileHandle(`${new_keyset_name}.json`, { create: true });

    const writer = await key_board.createWritable();
    await writer.write(serializeKeySet(key_set));
    await writer.close();

    displayConditionalNotification(settings, 'New Keyset Created', 'A new keyset has been created.');

    incrementVersion();
  };

  useEffect(() => {
    if (handle && Group && Client)
      pullClientKeyboards(handle, Group, Client).then((response) => {
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
      refresh: incrementVersion,
      addKeyboard,
      duplicateKeyboard,
    };
  }

  return {
    status: data.status,
    data: data.data,
    error: data.error,
    refresh: incrementVersion,
    addKeyboard,
    duplicateKeyboard,
  };
}
