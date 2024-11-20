import { CleanUpString } from '@/lib/strings';
import { toast } from 'sonner';

/**
 * Remove the client folder
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @param Individual The individual name
 * @returns
 */
export async function removeClientFolder(Handle: FileSystemDirectoryHandle, Group: string, Individual: string) {
  const perms = await Handle.requestPermission({ mode: 'readwrite' });

  if (perms === 'denied') {
    toast.error('Permission denied to remove group folder.');
    return;
  }

  const group_dir = await Handle.getDirectoryHandle(CleanUpString(Group));

  return await group_dir.removeEntry(Individual, { recursive: true });
}
