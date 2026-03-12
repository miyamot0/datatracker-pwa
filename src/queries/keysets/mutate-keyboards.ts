import { CleanUpString } from '@/lib/strings';
import { keyboardQueryOptions } from './query-keyboards';
import { createNewKeySet, serializeKeySet } from '@/lib/keyset';
import { v4 as uuidv4 } from 'uuid';
import { KeySet } from '@/types/keyset';
import { queryClient } from '@/App';

export type EvaluationRecord = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Conditions: string[];
};

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

        newKeysetsList.push(key_set);
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

      newKeysetsList.push(key_set);

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
