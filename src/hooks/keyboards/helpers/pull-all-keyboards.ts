import { GetHandleKeyboardsFolder } from '@/lib/files';
import { readKeyboardParameters } from '@/lib/reader';
import { CleanUpString } from '@/lib/strings';
import { KeySetExtended } from '@/types/keyset';

export const GetAllKeyboardsQuery = async (Handle?: FileSystemDirectoryHandle) => {
  const keysets: KeySetExtended[] = [];

  if (!Handle) return keysets;

  // Note: Handle = GROUPS
  for await (const grp_entry of Handle.values()) {
    const group_dir_handle = await Handle.getDirectoryHandle(CleanUpString(grp_entry.name), { create: false });

    // Note: CLIENTS
    for await (const client_entry of group_dir_handle.values()) {
      const keyboard_folder = await GetHandleKeyboardsFolder(
        Handle,
        CleanUpString(grp_entry.name),
        CleanUpString(client_entry.name)
      );

      // Note: KEYBOARDS
      for await (const kb_entry of keyboard_folder.values()) {
        if (kb_entry.kind === 'directory') continue;

        if (kb_entry.name.includes('.json')) {
          const keyset_obj = await readKeyboardParameters(kb_entry);

          if (keyset_obj)
            keysets.push({
              ...keyset_obj,
              Group: CleanUpString(grp_entry.name),
              Individual: CleanUpString(client_entry.name),
            } satisfies KeySetExtended);
        }
      }
    }
  }

  return keysets;
};
