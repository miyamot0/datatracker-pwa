import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

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

export function SyncOptionIndicator({
  value,
  remoteDirectory,
  handle,
  setRemoteFileList,
}: {
  value: { status: string; file: string };
  remoteDirectory?: FileSystemDirectoryHandle;
  handle?: FileSystemDirectoryHandle;
  setRemoteFileList: (value: string) => void;
}) {
  if (value.status === 'Unauthorized') return <></>;
  if (value.status === 'Synced') return <Badge variant={'outline'}>Synced</Badge>;

  return (
    <Button
      size={'sm'}
      variant={'default'}
      onClick={async () => {
        if (!remoteDirectory || !handle) return;

        const path_parts = value.file.split('/').filter((part) => part.trim().length > 0);

        if (path_parts.length === 0) return;

        const file_lcl = await getFileHandle(handle, value.file);
        const file_lcl_contents = await file_lcl?.getFile();
        const text = await readFileAsync(file_lcl_contents!);

        const file_handle_rem = await getFileHandle(remoteDirectory, value.file);
        const writer = await file_handle_rem?.createWritable();
        await writer?.write(new Blob([text as string]));
        await writer?.close();

        setRemoteFileList(value.file);
      }}
    >
      <RefreshCcw className="h-4 w-4 mr-2" />
      Sync File
    </Button>
  );
}
