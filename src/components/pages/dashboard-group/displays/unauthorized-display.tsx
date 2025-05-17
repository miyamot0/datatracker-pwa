import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AuthorizationInstructions from '../views/authorization-instructions';
import { FolderHandleContext } from '@/context/folder-context';
import { useContext } from 'react';
import { displayConditionalNotification } from '@/lib/notifications';
import BackButton from '@/components/ui/back-button';

export default function UnauthorizedDisplay() {
  const { setHandle, settings } = useContext(FolderHandleContext);

  return (
    <Card className="w-full max-w-screen-lg">
      <CardHeader className="flex flex-row w-full justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Program Access and Authorization</CardTitle>
          <CardDescription>You need to authorize the program to work with the desired local folder</CardDescription>
        </div>

        <BackButton Label="Back" />
      </CardHeader>

      <CardContent className="flex flex-col gap-1.5">
        <AuthorizationInstructions />
      </CardContent>

      <CardFooter className="flex flex-row">
        <Button
          className="w-full"
          onClick={async () => {
            const options = {
              startIn: 'documents',
              mode: 'readwrite',
            } as DirectoryPickerOptions;

            try {
              const directory_picker = await window.showDirectoryPicker(options);

              if (settings.EnforceDataFolderName === true && directory_picker.name !== 'DataTracker') {
                displayConditionalNotification(
                  settings,
                  'Error Authorizing Directory',
                  "Please select a folder named 'DataTracker' to continue.",
                  3000,
                  true
                );
                return;
              }

              if (directory_picker) {
                setHandle(directory_picker);

                displayConditionalNotification(
                  settings,
                  'Access Authorized',
                  'You can you interact with files in the relevant folder.'
                );
              }
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_error) {
              displayConditionalNotification(
                settings,
                'Error Authorizing Directory',
                'Please select an applicable, non-system folder to continue.',
                3000,
                true
              );
            }
          }}
        >
          Authorize Access
        </Button>
      </CardFooter>
    </Card>
  );
}
