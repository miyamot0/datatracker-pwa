import PageWrapper from '@/components/layout/page-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderHandleContext } from '@/context/folder-context';
import createHref from '@/lib/links';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileSyncingStatus } from '@/types/sync';
import SyncToRemoteTable from './tables/sync-to-remote-table';
import SyncFromRemoteTable from './tables/sync-from-remote-table';
import { RefreshCw } from 'lucide-react';

export default function ViewSyncPage() {
  const { handle, remote_handle } = useContext(FolderHandleContext);

  const [directionalSync, setDirectionalSync] = useState<FileSyncingStatus>('to_remote');

  const navigate = useNavigate();

  useEffect(() => {
    if (!handle) {
      navigate(createHref({ type: 'Dashboard' }), {
        unstable_viewTransition: true,
      });
      return;
    }
  }, [handle, navigate, remote_handle]);

  return (
    <PageWrapper breadcrumbs={[]} label={'File Sync'} className="select-none">
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between items-center">
          <div className="flex flex-col gap-1.5">
            <CardTitle>File Sync Assistant</CardTitle>
            <CardDescription>Sync Files as Necessary across Folders</CardDescription>
          </div>
          <Button
            variant={'outline'}
            onClick={() => setDirectionalSync((prev) => (prev === 'to_remote' ? 'from_remote' : 'to_remote'))}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {directionalSync === 'to_remote' ? 'Syncing to Remote' : 'Syncing from Remote'}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <p>
            This page assists with managing a shared/remote backup directory with which to sync files. Users may select
            a secondary or 'Remote' directory where files stored on the current machine can be copied. Once a secondary
            'Remote' directory is selected, files not present in the 'Remote' directory will be highlighted in the table
            below. Users may then choose to sync relevant files to the 'Remote' directory.
          </p>
          {handle && remote_handle && directionalSync === 'to_remote' && (
            <SyncToRemoteTable Handle={handle} RemoteHandle={remote_handle} />
          )}
          {handle && remote_handle && directionalSync === 'from_remote' && (
            <SyncFromRemoteTable Handle={handle} RemoteHandle={remote_handle} />
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
