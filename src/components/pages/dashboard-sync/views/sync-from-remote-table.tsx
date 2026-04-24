import { useEffect, useMemo, useState } from 'react';
import { ReliabilityDataTable } from '@/components/ui/data-table-reli';
import { toast } from 'sonner';
import { SyncEntryTableRow, ParsedSyncFile } from '@/types/sync';
import { useMainThreadSync } from '@/hooks/use-main-thread-sync';
import { syncColumns } from './sync-columns';

type Props = {
  Handle: FileSystemDirectoryHandle;
  RemoteHandle: FileSystemDirectoryHandle;
};

/**
 * Component for syncing files from the remote directory to the local directory.
 *
 * @param {FileSystemDirectoryHandle} Handle - The handle for the local directory.
 * @param {FileSystemDirectoryHandle} RemoteHandle - The handle for the remote directory.
 * @return {ReactNode} A table component displaying the sync status of files.
 */
export default function SyncFromRemoteTable({ Handle, RemoteHandle }: Props) {
  const [localFileList, setLocalFileList] = useState<ParsedSyncFile[]>([]);
  const [remoteFileList, setRemoteFileList] = useState<ParsedSyncFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { listBothFiles, syncFiles } = useMainThreadSync();

  useEffect(() => {
    if (!Handle || !RemoteHandle) {
      return;
    }

    const loadFiles = async () => {
      try {
        setIsLoading(true);
        const { localFiles, remoteFiles } = await listBothFiles(Handle, RemoteHandle);
        setLocalFileList(localFiles);
        setRemoteFileList(remoteFiles);
      } catch (error) {
        toast.error(`Failed to load file lists: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadFiles();
  }, [Handle, RemoteHandle, listBothFiles]);

  const sync_status = useMemo(() => {
    const localFilePaths = new Set(localFileList.map((l) => l.file));
    return remoteFileList
      .map((entry) => {
        if (localFilePaths.has(entry.file)) {
          return { ...entry, status: 'Synced' };
        } else {
          return { ...entry, status: 'Unsynced' };
        }
      })
      .filter((value) => value.status === 'Unsynced');
  }, [localFileList, remoteFileList]);

  return (
    <ReliabilityDataTable
      key={`from-remote-${localFileList.length}-${remoteFileList.length}`}
      direction="Local"
      columns={syncColumns}
      data={sync_status.map((g, index) => {
        return {
          id: `from-remote-${index}`,
          file: g.file,
          group: g.group,
          individual: g.individual,
          evaluation: g.evaluation,
          status: g.status,
          direction: 'Remote --> Local',
        } satisfies SyncEntryTableRow;
      })}
      callback={async (rows) => {
        toast.promise(
          async () => {
            const syncedFiles = await syncFiles(rows, RemoteHandle, Handle);

            const syncedPaths = new Set(syncedFiles);
            const newEntries = remoteFileList.filter((e) => syncedPaths.has(e.file));
            setLocalFileList((prev) => [...prev, ...newEntries]);
            return syncedFiles;
          },
          {
            loading: 'Syncing files from remote...',
            success: (syncedFiles) => {
              return `Successfully synced ${syncedFiles.length} file${syncedFiles.length === 1 ? '' : 's'} from remote!`;
            },
            error: (error) =>
              `Failed to sync files from remote: ${error instanceof Error ? error.message : String(error)}`,
          },
        );
      }}
      optionalButtons={
        <div className="flex gap-2">
          {isLoading && <span className="text-sm text-muted-foreground">Loading files...</span>}
        </div>
      }
    />
  );
}
