import PageWrapper from '@/components/layout/page-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderHandleContext } from '@/context/folder-context';
import { useContext, useRef, useState } from 'react';

export default function ViewSyncPage() {
  const { handle } = useContext(FolderHandleContext);
  const filesArray = useRef([] as string[]);

  const [fileList, setFileList] = useState<string[]>([]);

  async function iterativeRead(entry: FileSystemDirectoryHandle | FileSystemFileHandle, path: string) {
    if (entry.kind === 'file') {
      filesArray.current.push(path);
    } else if (entry.kind === 'directory') {
      const entries = await entry.values();

      for await (const entry of entries) {
        await iterativeRead(entry, path + '/' + entry.name);
      }
    }
  }

  return (
    <PageWrapper breadcrumbs={[]} label={'File Sync'} className="select-none">
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Present Sync List</CardTitle>
            <CardDescription>Identify Files in Need of Remote Sync</CardDescription>
          </div>
          <div
            onClick={async () => {
              if (!handle) return;

              const groups = await handle.values();

              for await (const group of groups) {
                if (group.kind === 'directory') {
                  iterativeRead(group, `/${group.name}`);
                }
              }

              setFileList(filesArray.current);
            }}
          >
            Click Here
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          {fileList.map((file) => (
            <p key={file}>{file}</p>
          ))}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
