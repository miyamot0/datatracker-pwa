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
 * Component for syncing files from the local directory to the remote directory.
 *
 * @param {FileSystemDirectoryHandle} Handle - The handle for the local directory.
 * @param {FileSystemDirectoryHandle} RemoteHandle - The handle for the remote directory.
 * @return {ReactNode} A table component displaying the sync status of files.
 */
export default function SyncToRemoteTable({ Handle, RemoteHandle }: Props) {
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
    const remoteFilePaths = new Set(remoteFileList.map((r) => r.file));
    return localFileList
      .map((entry) => {
        if (remoteFilePaths.has(entry.file)) {
          return { ...entry, status: 'Synced' };
        } else {
          return { ...entry, status: 'Unsynced' };
        }
      })
      .filter((value) => value.status === 'Unsynced');
  }, [localFileList, remoteFileList]);

  return (
    <ReliabilityDataTable
      key={`to-remote-${localFileList.length}-${remoteFileList.length}`}
      direction="Remote"
      columns={syncColumns}
      data={sync_status.map((g, index) => {
        return {
          id: `to-remote-${index}`,
          file: g.file,
          group: g.group,
          individual: g.individual,
          evaluation: g.evaluation,
          status: g.status,
          direction: 'Local --> Remote',
        } satisfies SyncEntryTableRow;
      })}
      callback={async (rows) => {
        toast.promise(
          async () => {
            const syncedFiles = await syncFiles(rows, Handle, RemoteHandle);
            // Update the remote file list with the newly synced files
            const syncedPaths = new Set(syncedFiles);
            const newEntries = localFileList.filter((e) => syncedPaths.has(e.file));
            setRemoteFileList((prev) => [...prev, ...newEntries]);
            return syncedFiles;
          },
          {
            loading: 'Syncing files to remote...',
            success: (syncedFiles) => {
              return `Successfully synced ${syncedFiles.length} file${syncedFiles.length === 1 ? '' : 's'} to remote!`;
            },
            error: (error) =>
              `Failed to sync files to remote: ${error instanceof Error ? error.message : String(error)}`,
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
