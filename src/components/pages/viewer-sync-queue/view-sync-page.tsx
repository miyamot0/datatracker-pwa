import PageWrapper from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FolderHandleContext } from '@/context/folder-context';
import createHref from '@/lib/links';
import { displayConditionalNotification } from '@/lib/notifications';
import { FolderIcon } from 'lucide-react';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SyncOptionIndicator } from './views/sync-option-indicator';

export default function ViewSyncPage() {
  const { handle, settings } = useContext(FolderHandleContext);

  const [localFileList, setLocalFileList] = useState<string[] | undefined>(undefined);
  const [remoteFileList, setRemoteFileList] = useState<string[] | undefined>(undefined);

  const [remoteDirectory, setRemoteDirectory] = useState<FileSystemDirectoryHandle | undefined>(undefined);

  const navigate = useNavigate();

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
    if (!handle) {
      navigate(createHref({ type: 'Dashboard' }), {
        unstable_viewTransition: true,
      });
      return;
    }

    const runner = async () => {
      const groups = await handle.values();
      const path_array: string[] = [];

      for await (const group of groups) {
        if (group.kind === 'directory') {
          await iterativeRead(group, `/${group.name}`, path_array);
        }
      }

      setLocalFileList(path_array);

      if (remoteDirectory) {
        const groups = await remoteDirectory.values();
        const path_array: string[] = [];

        for await (const group of groups) {
          if (group.kind === 'directory') {
            await iterativeRead(group, `/${group.name}`, path_array);
          }
        }

        setRemoteFileList(path_array);
      }
    };

    runner();
  }, [handle, iterativeRead, navigate, remoteDirectory]);

  const sync_status = useMemo(() => {
    if (!remoteFileList) return undefined;

    return localFileList
      ?.map((file) => {
        if (remoteFileList.includes(file)) {
          return { file, status: 'Synced' };
        } else {
          return { file, status: 'Unsynced' };
        }
      })
      .filter((value) => value.status === 'Unsynced');
  }, [localFileList, remoteFileList]);

  return (
    <PageWrapper breadcrumbs={[]} label={'File Sync'} className="select-none">
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Present Sync List</CardTitle>
            <CardDescription>Identify Files in Need of Remote Sync</CardDescription>
          </div>

          <div className="flex flex-row gap-2">
            <Button
              disabled={!!remoteDirectory}
              size={'sm'}
              onClick={async () => {
                const options = {
                  startIn: 'documents',
                  mode: 'readwrite',
                } as DirectoryPickerOptions;

                try {
                  const directory_picker = await window.showDirectoryPicker(options);

                  if (directory_picker) {
                    setRemoteDirectory(directory_picker);

                    displayConditionalNotification(
                      settings,
                      'Access Authorized',
                      'You can you interact with files in the relevant folder.'
                    );
                  }
                } catch (error) {
                  console.error(error);
                }
              }}
            >
              <FolderIcon className="h-4 w-4 mr-2" />
              Authorize Remote Backup
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <p>
            This page assists with managing a shared/remote backup directory with which to sync files. Users may select
            a secondary or 'Remote' directory where files stored on the current machine can be copied. Once a secondary
            'Remote' directory is selected, files not present in the 'Remote' directory will be highlighted in the table
            below. Users may then choose to sync relevant files to the 'Remote' directory.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Path</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Remote</TableHead>
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
                        <Badge>Available</Badge>
                      </TableCell>
                      <TableCell>
                        <SyncOptionIndicator
                          value={value}
                          remoteDirectory={remoteDirectory}
                          handle={handle}
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
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
