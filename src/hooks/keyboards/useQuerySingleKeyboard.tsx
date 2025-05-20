import { useEffect, useState } from 'react';
import { QueryResponseSingleKeyboard } from './types/query-response-type-keyboards';
import { deserializeKeySet, serializeKeySet } from '@/lib/keyset';
import { CleanUpString } from '@/lib/strings';
import { GetHandleKeyboardsFolder } from '@/lib/files';
import { displayConditionalNotification } from '@/lib/notifications';
import { KeySet, KeySetInstance } from '@/types/keyset';
import { FolderHandleContextType } from '@/context/folder-context';

export function useQuerySingleKeyboardFixed(
  Group: string,
  Client: string,
  Keyset: string,
  Context: FolderHandleContextType
) {
  const { handle, settings } = Context;
  const [version, setVersion] = useState(0);

  const [data, setData] = useState<QueryResponseSingleKeyboard>({
    status: 'loading',
    data: undefined,
  });

  const incrementVersion = () => setVersion((prev) => prev + 1);

  const mutateKeySet = async (new_keyset: KeySet) => {
    try {
      const keyboards_folder = await GetHandleKeyboardsFolder(handle!, Group, Client);

      const key_board = await keyboards_folder.getFileHandle(`${CleanUpString(Keyset)}.json`);

      const writer = await key_board.createWritable();
      await writer.write(serializeKeySet(new_keyset));
      await writer.close();

      displayConditionalNotification(settings, 'KeySet Updated', 'The current key set has been saved to file.');

      incrementVersion();

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e: unknown) {
      displayConditionalNotification(
        settings,
        'Error Updating Keys',
        'There was an error mutating the keyset',
        3000,
        true
      );
    }
  };

  const addKeyCallback = async (base_keyset: KeySet, new_key: KeySetInstance, type: 'Duration' | 'Frequency') => {
    let new_state = {
      ...base_keyset,
      lastModified: new Date(),
    };

    if (type === 'Duration') {
      new_state = {
        ...new_state,
        DurationKeys: [...base_keyset.DurationKeys, new_key],
      };
    } else {
      new_state = {
        ...new_state,
        FrequencyKeys: [...base_keyset.FrequencyKeys, new_key],
      };
    }

    await mutateKeySet(new_state);
  };

  useEffect(() => {
    GetHandleKeyboardsFolder(handle!, Group, Client).then(async (keyboard_folder) => {
      const file = await keyboard_folder.getFileHandle(`${CleanUpString(Keyset)}.json`, {
        create: true,
      });

      const keyset = await file.getFile();
      const keyset_text = await keyset.text();
      const keyset_json = deserializeKeySet(keyset_text);

      if (keyset_json) setData({ status: 'success', data: keyset_json });
      else setData({ status: 'error', data: undefined, error: 'No handle found' });
    });

    return () => {};
  }, [handle, Group, Client, version, Keyset]);

  if (data.status === 'error') {
    return {
      status: 'error',
      data: undefined,
      error: 'No handle found',
      handle,
      refresh: incrementVersion,
      mutateKeySet,
      addKeyCallback,
    };
  }

  return {
    status: data.status,
    data: data.data,
    error: data.error,
    handle,
    refresh: incrementVersion,
    mutateKeySet,
    addKeyCallback,
  };
}
