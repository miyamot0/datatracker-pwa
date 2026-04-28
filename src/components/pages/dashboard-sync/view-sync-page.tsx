import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSyncingStatus } from '@/types/sync';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { displayConditionalNotification } from '@/lib/notifications';
import BackButton from '@/components/ui/back-button';
import SyncToRemoteTable from './views/sync-to-remote-table';
import SyncFromRemoteTable from './views/sync-from-remote-table';
import { toast } from 'sonner';
import { ApplicationSettingsTypes } from '@/types/settings/application-settings';
import { SyncStatusBadge } from './views/sync-status-button';

type Props = {
  Settings: ApplicationSettingsTypes;
  Handle: FileSystemDirectoryHandle;
};

/**
 * Page to support syncing to and from multiple locations
 *
 * @param {ApplicationSettingsTypes} Settings - The application settings, used to conditionally display notifications.
 * @param {FileSystemDirectoryHandle} Handle - The handle for the local directory, used for syncing operations.
 * @return {*}
 */
export default function ViewSyncPage({ Settings, Handle }: Props) {
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
          const options = {
            startIn: 'documents',
            mode: 'readwrite',
          } as DirectoryPickerOptions;

          try {
            const directory_picker = await window.showDirectoryPicker(options);

            if (Settings.EnforceDataFolderName === true && directory_picker.name !== 'DataTracker') {
              displayConditionalNotification(
                Settings,
                'Error Authorizing Remote Directory',
                "Please select a remote folder named 'DataTracker' to continue.",
                3000,
                true,
              );
              return;
            }

            if (directory_picker) {
              setRemoteHandle(directory_picker);

              displayConditionalNotification(
                Settings,
                'Access Authorized',
                'You can you interact with files in the relevant folder.',
              );
            }
          } catch {
            toast.error(
              'Directory access was not authorized. Please try again and authorize access to a folder to continue.',
            );
          }
        }}
      >
        {!remote_handle ? 'Select Remote Backup' : 'Remote Backup Set'}
      </Button>
    );
  }, [remote_handle, setRemoteHandle, Settings]);

  const buttonFunctionality = useMemo(() => {
    return (
      <SyncStatusBadge active={!!remote_handle}>
        {!!remote_handle && buttonChangeDirection}

        {!remote_handle && buttonSetRemote}

        <BackButton />
      </SyncStatusBadge>
    );
  }, [remote_handle, buttonChangeDirection, buttonSetRemote]);

  return (
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
          This page assists with managing a shared/remote backup directory with which to sync files. Users may select a
          secondary (i.e., 'Remote') directory where files stored on the current machine can be copied to or copied
          from. Once a secondary 'Remote' directory is selected, files can be synced either *to the remote directory*
          (e.g., Reliability data) or *from the remote directory* (e.g., keyboards).
        </p>

        {remote_handle && directionalSync === 'to_remote' && (
          <SyncToRemoteTable Handle={Handle} RemoteHandle={remote_handle} />
        )}
        {remote_handle && directionalSync === 'from_remote' && (
          <SyncFromRemoteTable Handle={Handle} RemoteHandle={remote_handle} />
        )}
      </CardContent>
    </Card>
  );
}
