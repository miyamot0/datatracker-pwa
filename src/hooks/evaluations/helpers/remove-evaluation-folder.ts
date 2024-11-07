import { CleanUpString } from '@/lib/strings';
import { toast } from 'sonner';

/**
 * Remove the evaluation folder
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @param Individual The individual name
 * @param Evaluation The evaluation name
 * @returns
 */
export async function removeEvaluationFolder(
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string
) {
  const perms = await Handle.requestPermission({ mode: 'readwrite' });

  if (perms === 'denied') {
    toast.error('Permission denied to remove group folder.');
    return;
  }

  const group_dir = await Handle.getDirectoryHandle(CleanUpString(Group));
  const client_dir = await group_dir.getDirectoryHandle(CleanUpString(Individual));

  return await client_dir.removeEntry(CleanUpString(Evaluation), {
    recursive: true,
  });
}
