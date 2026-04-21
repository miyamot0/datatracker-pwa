import { createNewKeySet, serializeKeySet } from '@/lib/keyset';
import { CleanUpString } from '@/lib/strings';
import { KeySet } from '@/types/keyset';

/**
 * Imports an existing keyset into the specified group and individual directory within the file system. It checks if a keyset with the same name already exists, and if not, it creates a new keyset file with the provided keyset data. The function returns the imported KeySet object if successful, or null if a keyset with the same name already exists.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the keyset is being imported.
 * @param Individual - The individual identifier for which the keyset is being imported.
 * @param keysetBase - The keyset data to be imported.
 * @returns The imported KeySet object if successful, or null if a keyset with the same name already exists.
 */
export async function importExistingKeyset(
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  keysetBase: KeySet,
): Promise<KeySet | null> {
  const individuals_folder = await Handle.getDirectoryHandle(CleanUpString(Group), { create: true });
  const keyboards_folder = await individuals_folder.getDirectoryHandle(CleanUpString(Individual), { create: true });

  let keyboardExists = false;

  const entries = await keyboards_folder.values();

  for await (const entry of entries) {
    if (entry.kind !== 'directory' && entry.name === keysetBase.Name) {
      keyboardExists = true;
      break;
    }
  }

  if (keyboardExists) {
    window.alert('Keyset already exists');
    return null;
  }

  const keySet: KeySet = createNewKeySet(keysetBase.Name);
  const keySetMapped: KeySet = {
    ...keySet,
    FrequencyKeys: keysetBase.FrequencyKeys,
    DurationKeys: keysetBase.DurationKeys,
  };

  const keyBoard = await keyboards_folder.getFileHandle(`${keysetBase.Name}.json`, {
    create: true,
  });

  const writer = await keyBoard.createWritable();
  await writer.write(serializeKeySet(keySetMapped));
  await writer.close();

  return keySetMapped;
}

/**
 * Imports multiple existing keysets into the specified group and individual directory within the file system. It iterates through the provided array of keysets and attempts to import each one using the importExistingKeyset function. The function returns an array of successfully imported KeySet objects, while any keysets that already exist will be skipped with an alert notification.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the keysets are being imported.
 * @param Individual - The individual identifier for which the keysets are being imported.
 * @param keysets - An array of KeySet objects to be imported.
 * @returns An array of successfully imported KeySet objects. Any keysets that already exist will be skipped with an alert notification.
 */
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
