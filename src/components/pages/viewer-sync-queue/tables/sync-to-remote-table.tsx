import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { ColumnDef } from '@tanstack/react-table';
import { ReliabilityDataTable } from '@/components/ui/data-table-reli';
import { Checkbox } from '@/components/ui/checkbox';
import { SyncEntryTableRow } from '../types/sync-entry-table-row';
import { readFileAsync } from '../helpers/read-file-async';
import { getFileHandle } from '../helpers/get-file-handle-async';

type Props = {
  Handle: FileSystemDirectoryHandle;
  RemoteHandle: FileSystemDirectoryHandle;
};

async function writeOutFileToRemote(
  remoteDirectory: FileSystemDirectoryHandle,
  handle: FileSystemDirectoryHandle,
  value: SyncEntryTableRow
) {
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
}

async function syncAllFiles(
  rows: SyncEntryTableRow[],
  Handle: FileSystemDirectoryHandle,
  RemoteHandle: FileSystemDirectoryHandle,
  SetRemoteCallback: React.Dispatch<React.SetStateAction<string[]>>
) {
  const files_added: string[] = [];
  for (const row of rows) {
    writeOutFileToRemote(RemoteHandle, Handle, row);
    files_added.push(row.file);
  }

  SetRemoteCallback((prev) => [...(prev ?? []), ...files_added]);
}

export default function SyncToRemoteTable({ Handle, RemoteHandle }: Props) {
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
      size: 100,
    },
    {
      accessorKey: 'file',
      header: ({ column }) => <DataTableColumnHeader className="w-full" column={column} title="Unsynced File Path" />,
    },
  ];

  return (
    <ReliabilityDataTable
      direction="Remote"
      columns={columns}
      data={sync_status.map((g) => {
        return {
          file: g.file,
          status: g.status,
          direction: 'Local --> Remote',
        } satisfies SyncEntryTableRow;
      })}
      callback={(rows) => {
        syncAllFiles(rows, Handle, RemoteHandle, setRemoteFileList);
      }}
      optionalButtons={<div className="flex gap-2"></div>}
    />
  );
}
