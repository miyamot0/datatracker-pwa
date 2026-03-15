import { deserializeKeySet } from '@/lib/keyset';
import { CleanUpString } from '@/lib/strings';
import { KeySet } from '@/types/keyset';

/**
 * Queries the keyboards for a specific group and individual by accessing the file system and retrieving the relevant information about the keyboards stored within the individual's folder. It returns an array of KeySet objects that contain the details of each keyboard found, or an empty array if no keyboards are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the keyboards are being queried.
 * @param Individual - The individual identifier for which the keyboards are being queried.
 * @returns A promise that resolves to an array of KeySet objects containing the details of each keyboard found, or an empty array if no keyboards are found or if there is an error during the file system operations.
 */
export const keyboardQueryOptions = (Handle: FileSystemDirectoryHandle, Group: string, Individual: string) => ({
  queryKey: ['/', Group, Individual, 'keyboards'],
  queryFn: () => fetchKeyboards({ Handle, Group, Individual }),
});

/**
 * Fetches the keyboards for a specific group and individual by accessing the file system and retrieving the relevant information about the keyboards stored within the individual's folder. It returns an array of KeySet objects that contain the details of each keyboard found, or an empty array if no keyboards are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the keyboards are being fetched.
 * @param Individual - The individual identifier for which the keyboards are being fetched.
 * @returns A promise that resolves to an array of KeySet objects containing the details of each keyboard found, or an empty array if no keyboards are found or if there is an error during the file system operations.
 */
export const fetchKeyboards = async ({
  Handle,
  Group,
  Individual,
}: {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
}): Promise<KeySet[]> => {
  const keysets: KeySet[] = [];

  try {
    const individuals_folder = await Handle.getDirectoryHandle(CleanUpString(Group), { create: true });
    const keyboards_folder = await individuals_folder.getDirectoryHandle(CleanUpString(Individual), { create: true });

    for await (const entry of keyboards_folder.values()) {
      if (entry.name === '.DS_Store') continue;

      if (entry.kind === 'file' && entry.name.endsWith('.json')) {
        const keyset = await entry.getFile();
        const keyset_text = await keyset.text();

        if (keyset_text.length === 0) continue;

        const keyset_json = deserializeKeySet(keyset_text);

        if (keyset_json) {
          keysets.push(keyset_json);
        }
      }
    }

    return keysets;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return [];
  }
};
