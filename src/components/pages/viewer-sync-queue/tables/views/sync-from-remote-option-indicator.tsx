import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

function readFileAsync(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function getFileHandle(
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

export function SyncFromRemoteOptionIndicator({
  value,
  remoteDirectory,
  handle,
  setLocalFileList,
}: {
  value: { status: string; file: string };
  remoteDirectory?: FileSystemDirectoryHandle;
  handle?: FileSystemDirectoryHandle;
  setLocalFileList: (value: string) => void;
}) {
  if (value.status === 'Unauthorized') return <></>;
  if (value.status === 'Synced') return <Badge variant={'outline'}>Synced</Badge>;

  return (
    <Button
      size={'sm'}
      variant={'outline'}
      onClick={async () => {
        if (!remoteDirectory || !handle) return;

        const path_parts = value.file.split('/').filter((part) => part.trim().length > 0);

        if (path_parts.length === 0) return;

        const file_rem = await getFileHandle(remoteDirectory, value.file);
        const file_rem_contents = await file_rem?.getFile();
        const text = await readFileAsync(file_rem_contents!);

        const file_handle_lcl = await getFileHandle(handle, value.file);
        const writer = await file_handle_lcl?.createWritable();
        await writer?.write(new Blob([text as string]));
        await writer?.close();

        setLocalFileList(value.file);

        toast.success('File Synced Successfully');
      }}
    >
      <RefreshCcw className="h-4 w-4 mr-2" />
      Sync File to Local
    </Button>
  );
}
