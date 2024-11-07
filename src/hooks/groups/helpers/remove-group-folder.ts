import { toast } from 'sonner';

/**
 * Remove the group folder
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @returns
 */
export async function removeGroupFolder(Handle: FileSystemDirectoryHandle, Group: string) {
  const perms = await Handle.requestPermission({ mode: 'readwrite' });

  if (perms === 'denied') {
    toast.error('Permission denied to remove group folder.');
    return;
  }

  return await Handle.removeEntry(Group, { recursive: true });
}
