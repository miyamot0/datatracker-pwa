import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SyncToRemoteOptionIndicator } from './views/sync-to-remote-option-indicator';
import { ArrowRight } from 'lucide-react';

type Props = {
  Handle: FileSystemDirectoryHandle;
  RemoteHandle: FileSystemDirectoryHandle;
};

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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>File Path</TableHead>
          <TableHead>Operation</TableHead>
          <TableHead>Remote</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sync_status
          .sort((a, b) => -a.status.localeCompare(b.status))
          .map((value, index) => {
            return (
              <TableRow key={index}>
                <TableCell>{value.file}</TableCell>
                <TableCell>
                  <span className="flex flex-row gap-1 items-center">
                    Local <ArrowRight className="h-4 w-4" /> Remote
                  </span>
                </TableCell>
                <TableCell>
                  <SyncToRemoteOptionIndicator
                    value={value}
                    remoteDirectory={RemoteHandle}
                    handle={Handle}
                    setRemoteFileList={(value: string) => {
                      setRemoteFileList([...(remoteFileList ?? []), value]);
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
