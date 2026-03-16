import { CleanUpString } from '@/lib/strings';
import { keyboardQueryOptions } from './query-keyboards';
import { createNewKeySet, serializeKeySet } from '@/lib/keyset';
import { v4 as uuidv4 } from 'uuid';
import { KeySet } from '@/types/keyset';
import { queryClient } from '@/App';

/**
 * Mutates the list of keyboards based on the specified action (Add, Delete, Duplicate, Rename, Update) for a given group and individual. It interacts with the file system to create, delete, duplicate, or update keyboard files accordingly and returns the updated list of KeySet objects.
 *
 * @param Group - The group identifier for which the keyboards are being mutated.
 * @param Individual - The individual identifier for which the keyboards are being mutated.
 * @param Keysets - An array of keyboard names that are to be acted upon based on the specified action.
 * @param Rename - (Optional) The new name for the keyboard when the action is 'Duplicate' or 'Rename'.
 * @param NewKeySet - (Optional) The new KeySet object to be used when the action is 'Update'.
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Action - The type of mutation action to be performed on the keyboards (Add, Delete, Duplicate, Rename, Update).
 * @returns A promise that resolves to the updated list of KeySet objects after the mutation is complete.
 */
export const mutationKeyboards = async ({
  Group,
  Individual,
  Keysets,
  Rename,
  NewKeySet,
  Handle,
  Action,
}: {
  Group: string;
  Individual: string;
  Keysets: string[];
  Rename?: string;
  NewKeySet?: KeySet;
  Handle: FileSystemDirectoryHandle;
  Action: 'Add' | 'Delete' | 'Duplicate' | 'Rename' | 'Update';
}): Promise<KeySet[]> => {
  const keysets: KeySet[] = await queryClient.fetchQuery(keyboardQueryOptions(Handle, Group, Individual));

  if (!keysets) {
    throw new Error('Keysets not found');
  }

  let newKeysetsList = keysets;

  const group_dir = await Handle.getDirectoryHandle(CleanUpString(Group));
  const individual_dir = await group_dir.getDirectoryHandle(Individual);

  switch (Action) {
    case 'Add':
      {
        const key_set = createNewKeySet(Keysets[0]);

        const key_board = await individual_dir.getFileHandle(`${Keysets[0]}.json`, { create: true });

        const writer = await key_board.createWritable();
        await writer.write(serializeKeySet(key_set));
        await writer.close();

        newKeysetsList = [...newKeysetsList, key_set];
      }
      break;
    case 'Delete':
      for (let i = 0; i < Keysets.length; i++) {
        const individualKeySet = Keysets[i];

        try {
          const fileHandle = await individual_dir.getFileHandle(`${individualKeySet}.json`);
          await individual_dir.removeEntry(fileHandle.name);
        } catch {
          throw new Error(`Failed to remove keyboard: ${individualKeySet}.json`);
        }

        newKeysetsList = newKeysetsList.filter((e) => e.Name != individualKeySet);
      }

      break;
    case 'Duplicate': {
      const keySetMatch = keysets.find((ks) => ks.Name === Keysets[0].trim());

      if (!keySetMatch) {
        throw new Error('No matching KeySet found.');
      }

      if (!Rename) {
        throw new Error('No Rename text supplied.');
      }

      const key_set = {
        ...keySetMatch,
        Name: Rename,
        id: uuidv4(),
        createdAt: new Date(),
        lastModified: new Date(),
      };

      const key_board = await individual_dir.getFileHandle(`${Rename}.json`, { create: true });

      const writer = await key_board.createWritable();
      await writer.write(serializeKeySet(key_set));
      await writer.close();

      newKeysetsList = [...newKeysetsList, key_set];

      break;
    }
    case 'Update': {
      if (!NewKeySet) {
        throw new Error('Keysets not supplied');
      }

      const key_board = await individual_dir.getFileHandle(`${NewKeySet.Name}.json`);

      const writer = await key_board.createWritable();
      await writer.write(serializeKeySet(NewKeySet));
      await writer.close();

      newKeysetsList = newKeysetsList.map((k) => {
        if (k.Name == NewKeySet.Name) {
          return NewKeySet;
        }

        return k;
      });

      break;
    }

    case 'Rename': {
      // TODO: Rename keyboard in future

      break;
    }
  }

  return newKeysetsList;
};
