export async function getFileHandle(
  lcl_handle: FileSystemDirectoryHandle,
  path: string
): Promise<FileSystemFileHandle | undefined> {
  if (!lcl_handle) return;

  const path_parts = path.split('/').filter((part) => part.trim().length > 0);
  if (path_parts.length === 0) throw new Error('Invalid Path');

  let handle_rem = lcl_handle;

  for (let i = 0; i < path_parts.length; i++) {
    const is_file = i === path_parts.length - 1;

    if (is_file) {
      const file_handle_rem = await handle_rem.getFileHandle(path_parts[i], { create: true });

      return file_handle_rem;
    } else {
      handle_rem = await handle_rem.getDirectoryHandle(path_parts[i], { create: true });
    }
  }
}
