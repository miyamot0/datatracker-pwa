import { createNewKeySet, serializeKeySet } from '@/lib/keyset';
import { CleanUpString } from '@/lib/strings';
import { KeySet } from '@/types/keyset';

const importExistingKeyset = async (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  keyset_base: KeySet,
): Promise<KeySet | null> => {
  const individuals_folder = await Handle.getDirectoryHandle(CleanUpString(Group), { create: true });
  const keyboards_folder = await individuals_folder.getDirectoryHandle(CleanUpString(Individual), { create: true });

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
    return null;
  }

  const key_set: KeySet = createNewKeySet(keyset_base.Name);
  const key_set_mapped: KeySet = {
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

  return key_set_mapped;
};

export const importExistingKeysets = async (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  keysets: KeySet[],
) => {
  const newCopies: KeySet[] = [];

  for (const keyset of keysets) {
    const newSet = await importExistingKeyset(Handle, Group, Individual, keyset);

    if (newSet) {
      newCopies.push(newSet);
    }
  }

  return newCopies;
};
