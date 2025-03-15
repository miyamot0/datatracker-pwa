import { LoadingStructureKeysets } from '@/types/working';
import { Dispatch, SetStateAction } from 'react';
import { readKeyboardParameters } from './reader';
import { GetHandleKeyboardsFolder } from './files';

/**
 * Get the keysets from the handle
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @param Individual The individual name
 * @param SetKeyboards The state setter for the keysets
 */
export const getClientKeyboards = async (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  SetKeyboards: Dispatch<SetStateAction<LoadingStructureKeysets>>
) => {
  try {
    const keyboard_folder = await GetHandleKeyboardsFolder(Handle, Group, Individual);

    const keysets = [];

    for await (const entry of keyboard_folder.values()) {
      const keyset_obj = await readKeyboardParameters(entry);

      if (keyset_obj) keysets.push(keyset_obj);
    }

    SetKeyboards({
      Status: 'complete',
      KeySets: keysets,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    SetKeyboards({
      Status: 'error',
      KeySets: [],
      Error: (error as Error).message,
    });
  }
};
