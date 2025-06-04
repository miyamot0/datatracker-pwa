import { FolderHandleContextType } from '@/context/folder-context';
import { useEffect, useState } from 'react';
import { QueryResponseKeyboardsMetaExpanded } from './types/query-response-type-keyboards';
import { GetAllKeyboardsQuery } from './helpers/pull-all-keyboards';
import { GetHandleKeyboardsFolder } from '@/lib/files';
import { KeySet } from '@/types/keyset';
import { createNewKeySet, serializeKeySet } from '@/lib/keyset';

export function useQueryKeyboardsMetaFixed(Group: string, Client: string, Context: FolderHandleContextType) {
  const { handle } = Context;
  const [version, setVersion] = useState(0);

  const [data, setData] = useState<QueryResponseKeyboardsMetaExpanded>({
    status: 'loading',
    data: [],
    handle,
  });

  const incrementVersion = () => setVersion((prev) => prev + 1);

  const importExistingKeyset = async (keyset_base: KeySet) => {
    const keyboards_folder = await GetHandleKeyboardsFolder(handle!, Group, Client);

    let keyboard_exists = false;

    const entries = await keyboards_folder.values();

    for await (const entry of entries) {
      if (entry.kind !== 'directory' && entry.name === keyset_base.Name) {
        keyboard_exists = true;
        break;
      }
    }

    if (keyboard_exists) {
      window.alert('Keyset already exists');
      return;
    }

    const key_set = createNewKeySet(keyset_base.Name);
    const key_set_mapped = {
      ...key_set,
      FrequencyKeys: keyset_base.FrequencyKeys,
      DurationKeys: keyset_base.DurationKeys,
    };

    const key_board = await keyboards_folder.getFileHandle(`${keyset_base.Name}.json`, {
      create: true,
    });

    const writer = await key_board.createWritable();
    await writer.write(serializeKeySet(key_set_mapped));
    await writer.close();
  };

  const importExistingKeysets = async (keysets: KeySet[]) => {
    for (const keyset of keysets) {
      await importExistingKeyset(keyset);
    }
    incrementVersion();
  };

  useEffect(() => {
    try {
      GetAllKeyboardsQuery(handle!).then((keyboards) => {
        // Note: Pull relevant keyboards to compare against
        try {
          const client_keyboards = keyboards.filter(
            (keyboard) => keyboard.Group === Group && keyboard.Individual === Client
          );
          const client_keyboards_by_name = client_keyboards.map((keyboard) => keyboard.Name);

          // Note: Filter out duplicated names
          const filteredKeyboards = keyboards.filter(
            (keyboard) => keyboard.Individual !== Client && !client_keyboards_by_name.includes(keyboard.Name)
          );
          setData({ status: 'success', data: filteredKeyboards });
        } catch (err: unknown) {
          setData({ status: 'error', data: [], error: (err as Error).message });
        }
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setData({ status: 'error', data: [], error: err.message });
      }
    }

    return () => {};
  }, [handle, Group, Client, version]);

  if (data.status === 'error') {
    return {
      status: 'error',
      data: [],
      error: 'No handle found',
      refresh: incrementVersion,
      importExistingKeysets,
    };
  }

  return {
    status: data.status,
    data: data.data,
    error: data.error,
    refresh: incrementVersion,
    importExistingKeysets,
  };
}
