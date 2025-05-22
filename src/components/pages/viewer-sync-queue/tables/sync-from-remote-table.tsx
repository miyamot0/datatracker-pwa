import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SyncFromRemoteOptionIndicator } from './views/sync-from-remote-option-indicator';
import { ArrowLeft } from 'lucide-react';
import { SyncEntryTableRow } from '../types/sync-entry-table-row';
import { ReliabilityDataTable } from '@/components/ui/data-table-reli';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { getFileHandle } from '../helpers/get-file-handle-async';
import { readFileAsync } from '../helpers/read-file-async';
import { toast } from 'sonner';

type Props = {
  Handle: FileSystemDirectoryHandle;
  RemoteHandle: FileSystemDirectoryHandle;
};

async function writeOutFileToLocal(
  remoteDirectory: FileSystemDirectoryHandle,
  handle: FileSystemDirectoryHandle,
  value: SyncEntryTableRow
) {
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
}

async function syncAllFiles(
  rows: SyncEntryTableRow[],
  Handle: FileSystemDirectoryHandle,
  RemoteHandle: FileSystemDirectoryHandle,
  SetLocalCallback: React.Dispatch<React.SetStateAction<string[]>>
) {
  const files_added: string[] = [];
  for (const row of rows) {
    writeOutFileToLocal(RemoteHandle, Handle, row);
    files_added.push(row.file);
  }

  SetLocalCallback((prev) => [...(prev ?? []), ...files_added]);
}

export default function SyncFromRemoteTable({ Handle, RemoteHandle }: Props) {
  const [localFileList, setLocalFileList] = useState<string[]>([]);
  const [remoteFileList, setRemoteFileList] = useState<string[]>([]);

  const iterativeRead = useCallback(
    async (entry: FileSystemDirectoryHandle | FileSystemFileHandle, path: string, path_array: string[]) => {
      if (entry.kind === 'file') {
        path_array.push(path);
      } else if (entry.kind === 'directory') {
        const entries = await entry.values();

        for await (const entry of entries) {
          await iterativeRead(entry, path + '/' + entry.name, path_array);
        }
      }
    },
    []
  );

  useEffect(() => {
    const runner = async () => {
      const groups = await Handle.values();
      const path_array: string[] = [];

      for await (const group of groups) {
        if (group.kind === 'directory') {
          await iterativeRead(group, `/${group.name}`, path_array);
        }
      }

      setLocalFileList(path_array);

      const groups2 = await RemoteHandle.values();
      const path_array2: string[] = [];

      for await (const group of groups2) {
        if (group.kind === 'directory') {
          await iterativeRead(group, `/${group.name}`, path_array2);
        }
      }

      setRemoteFileList(path_array2);
    };

    runner();
  }, [Handle, RemoteHandle, iterativeRead]);

  const sync_status = useMemo(() => {
    return remoteFileList
      .map((file) => {
        if (localFileList.includes(file)) {
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
      size: 100,
    },
    {
      accessorKey: 'file',
      header: ({ column }) => <DataTableColumnHeader className="w-full" column={column} title="Unsynced File Path" />,
    },
  ];

  return (
    <ReliabilityDataTable
      direction="Local"
      columns={columns}
      data={sync_status.map((g) => {
        return {
          file: g.file,
          status: g.status,
          direction: 'Remote --> Local',
        } satisfies SyncEntryTableRow;
      })}
      callback={(rows) => {
        toast.promise(async () => await syncAllFiles(rows, Handle, RemoteHandle, setLocalFileList), {
          loading: 'Syncing all files...',
          success: () => {
            return 'Files successfully synced!';
          },
          error: () => {
            return 'Files were not written to disk.';
          },
        });
      }}
      optionalButtons={<div className="flex gap-2"></div>}
    />
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>File Path</TableHead>
          <TableHead>Operation</TableHead>
          <TableHead>Local</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sync_status
          ?.sort((a, b) => -a.status.localeCompare(b.status))
          .map((value, index) => {
            return (
              <TableRow key={index}>
                <TableCell>{value.file}</TableCell>
                <TableCell>
                  <span className="flex flex-row gap-1 items-center">
                    Local <ArrowLeft className="h-4 w-4" /> Remote
                  </span>
                </TableCell>
                <TableCell>
                  <SyncFromRemoteOptionIndicator
                    value={value}
                    remoteDirectory={RemoteHandle}
                    handle={Handle}
                    setLocalFileList={(value: string) => {
                      setLocalFileList([...(localFileList ?? []), value]);
                    }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
}
