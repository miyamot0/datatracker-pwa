import { GetHandleKeyboardsFolder } from '@/lib/files';
import { deserializeKeySet } from '@/lib/keyset';
import { CleanUpString } from '@/lib/strings';
import { QueryResponseKeyboards } from '../types/query-response-type-keyboards';

/**
 * Pulls all evaluation folders from the provided directory handle.
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @param Client The client name
 * @returns Evaluations in the relevant directory
 */
export const pullClientKeyboards = async (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Client: string
): Promise<QueryResponseKeyboards> => {
  try {
    const keyboard_folder = await GetHandleKeyboardsFolder(Handle, CleanUpString(Group), CleanUpString(Client));

    const keysets = [];

    for await (const entry of keyboard_folder.values()) {
      if (entry.name === '.DS_Store') continue;

      if (entry.kind === 'file' && entry.name.endsWith('.json')) {
        const keyset = await entry.getFile();
        const keyset_text = await keyset.text();

        if (keyset_text.length === 0) continue;

        const keyset_json = deserializeKeySet(keyset_text);

        if (keyset_json) keysets.push(keyset_json);
      }
    }

    return {
      status: 'success',
      data: keysets,
    };
  } catch (error) {
    return {
      status: 'error',
      data: [],
      error: error as string,
    };
  }
};
