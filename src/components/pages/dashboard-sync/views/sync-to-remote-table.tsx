import { useEffect, useMemo, useState } from 'react';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { ColumnDef } from '@tanstack/react-table';
import { ReliabilityDataTable } from '@/components/ui/data-table-reli';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { SyncEntryTableRow } from '@/types/sync';
import { useMainThreadSync } from '@/hooks/use-main-thread-sync';

type Props = {
  Handle: FileSystemDirectoryHandle;
  RemoteHandle: FileSystemDirectoryHandle;
};

export default function SyncToRemoteTable({ Handle, RemoteHandle }: Props) {
  const [localFileList, setLocalFileList] = useState<string[]>([]);
  const [remoteFileList, setRemoteFileList] = useState<string[]>([]);
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
    return localFileList
      .map((file) => {
        if (remoteFileList.includes(file)) {
          return { file, status: 'Synced' };
        } else {
          return { file, status: 'Unsynced' };
        }
      })
      .filter((value) => value.status === 'Unsynced');
  }, [localFileList, remoteFileList]);

  const columns: ColumnDef<SyncEntryTableRow>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'file',
      header: ({ column }) => <DataTableColumnHeader className="w-full" column={column} title="Unsynced File Path" />,
    },
  ];

  return (
    <ReliabilityDataTable
      key={`to-remote-${localFileList.length}-${remoteFileList.length}`}
      direction="Remote"
      columns={columns}
      data={sync_status.map((g, index) => {
        return {
          id: `to-remote-${index}`,
          file: g.file || '',
          status: g.status,
          direction: 'Local --> Remote',
        } satisfies SyncEntryTableRow;
      })}
      callback={async (rows) => {
        toast.promise(
          async () => {
            const syncedFiles = await syncFiles(rows, Handle, RemoteHandle);
            // Update the remote file list with the newly synced files
            setRemoteFileList((prev) => [...prev, ...syncedFiles]);
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
