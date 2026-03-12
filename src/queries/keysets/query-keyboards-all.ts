import { readKeyboardParameters } from '@/lib/reader';
import { CleanUpString } from '@/lib/strings';
import { KeySetExtended } from '@/types/keyset';

export const keyboardsAllQueryOptions = (Handle: FileSystemDirectoryHandle, Group: string, Individual: string) => ({
  queryKey: ['/', Group, 'metaKeyboards'],
  queryFn: () => fetchKeyboardsAll({ Handle, Group, Individual }),
});

export const fetchKeyboardsAll = async ({
  Handle,
  Group,
  Individual,
}: {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
}) => {
  let keysets: KeySetExtended[] = [];

  try {
    for await (const groupFolderEntry of Handle.values()) {
      if (groupFolderEntry.kind !== 'directory') continue;

      const group_dir_handle = await Handle.getDirectoryHandle(CleanUpString(groupFolderEntry.name), {
        create: false,
      });

      // Note: CLIENTS
      for await (const client_entry of group_dir_handle.values()) {
        if (client_entry.kind !== 'directory') continue;

        const keyboards_folder = await group_dir_handle.getDirectoryHandle(CleanUpString(client_entry.name), {
          create: false,
        });

        // Note: KEYBOARDS
        for await (const kb_entry of keyboards_folder.values()) {
          if (kb_entry.kind === 'directory') continue;

          if (kb_entry.name.includes('.json')) {
            try {
              const keyset_obj = await readKeyboardParameters(kb_entry);

              if (keyset_obj)
                keysets.push({
                  ...keyset_obj,
                  Group: CleanUpString(groupFolderEntry.name),
                  Individual: CleanUpString(client_entry.name),
                } satisfies KeySetExtended);
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (err: unknown) {
              //if (err instanceof Error) {
              //  toast.error(`Error reading ${err.message}`);
              //}
            }
          }
        }
      }
    }

    const clientKeyboards = keysets.filter(
      (keyboard) => keyboard.Group === Group && keyboard.Individual === Individual,
    );

    const clientKeyboardNames = clientKeyboards.map((keyboard) => keyboard.Name);

    keysets = keysets.filter(
      (keyboard) => keyboard.Individual !== Individual && !clientKeyboardNames.includes(keyboard.Name),
    );

    return keysets;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return [];
  }
};
