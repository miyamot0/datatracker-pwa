import PageWrapper from '@/components/layout/page-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderHandleContextType } from '@/context/folder-context';
import createHref from '@/lib/links';
import { useMemo, useState } from 'react';
import { redirect, useLoaderData } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileSyncingStatus } from '@/types/sync';
import SyncToRemoteTable from './tables/sync-to-remote-table';
import SyncFromRemoteTable from './tables/sync-from-remote-table';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { displayConditionalNotification } from '@/lib/notifications';
import BackButton from '@/components/ui/back-button';
import { WrappedButton } from './views/wrapped-btn';

type LoaderResult = {
  Context: FolderHandleContextType;
};

// eslint-disable-next-line react-refresh/only-export-components
export const syncPageLoader = (ctx: FolderHandleContextType) => {
  const { handle } = ctx;

  return async () => {
    if (!handle) {
      const response = redirect(createHref({ type: 'Dashboard' }));
      throw response;
    }

    return {
      Context: ctx,
    } satisfies LoaderResult;
  };
};

export default function ViewSyncPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Context } = loaderResult;
  const { settings, handle } = Context;

  const [remote_handle, setRemoteHandle] = useState<FileSystemDirectoryHandle | undefined>();
  const [directionalSync, setDirectionalSync] = useState<FileSyncingStatus>('to_remote');

  const buttonChangeDirection = useMemo(() => {
    return (
      <Button
        variant={'outline'}
        className="shadow"
        size={'sm'}
        onClick={() => setDirectionalSync((prev) => (prev === 'to_remote' ? 'from_remote' : 'to_remote'))}
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        {directionalSync === 'to_remote' ? 'Syncing TO Remote' : 'Syncing FROM Remote'}
      </Button>
    );
  }, [directionalSync]);

  const buttonSetRemote = useMemo(() => {
    return (
      <Button
        variant={'outline'}
        size={'sm'}
        className={cn('w-full md:max-w-[250px] shadow')}
        onClick={async () => {
          if (remote_handle) {
            return (
              <Button
                variant={'outline'}
                size={'sm'}
                onClick={() => setDirectionalSync((prev) => (prev === 'to_remote' ? 'from_remote' : 'to_remote'))}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {directionalSync === 'to_remote' ? 'Syncing to Remote' : 'Syncing from Remote'}
              </Button>
            );
          }

          const options = {
            startIn: 'documents',
            mode: 'readwrite',
          } as DirectoryPickerOptions;

          try {
            const directory_picker = await window.showDirectoryPicker(options);

            if (settings.EnforceDataFolderName === true && directory_picker.name !== 'DataTracker') {
              displayConditionalNotification(
                settings,
                'Error Authorizing Remote Directory',
                "Please select a remote folder named 'DataTracker' to continue.",
                3000,
                true
              );
              return;
            }

            if (directory_picker) {
              setRemoteHandle(directory_picker);

              displayConditionalNotification(
                settings,
                'Access Authorized',
                'You can you interact with files in the relevant folder.'
              );
            }
          } catch {
            //console.error(error);
          }
        }}
      >
        {!remote_handle !== false ? 'Select Remote Backup' : 'Remote Backup Set'}
      </Button>
    );
  }, [directionalSync, remote_handle, setRemoteHandle, settings]);

  const buttonFunctionality = useMemo(() => {
    return (
      <WrappedButton active={!!remote_handle}>
        {!!remote_handle !== false && buttonChangeDirection}

        {!remote_handle && buttonSetRemote}

        <BackButton Label="Back" />
      </WrappedButton>
    );
  }, [remote_handle, buttonChangeDirection, buttonSetRemote]);

  return (
    <PageWrapper breadcrumbs={[]} label={'File Sync'} className="select-none">
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>File Sync Assistant</CardTitle>
            <CardDescription>Sync Files as Necessary across Folders</CardDescription>
          </div>
          {buttonFunctionality}
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <p>
            This page assists with managing a shared/remote backup directory with which to sync files. Users may select
            a secondary (i.e., 'Remote') directory where files stored on the current machine can be copied to or copied
            from. Once a secondary 'Remote' directory is selected, files can be synced either *to the remote directory*
            (e.g., Reliability data) or *from the remote directory* (e.g., keyboards).
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
