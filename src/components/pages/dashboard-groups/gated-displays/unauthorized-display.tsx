import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { displayConditionalNotification } from '@/lib/notifications';
import BackButton from '@/components/ui/back-button';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { useContext } from 'react';
import { FolderHandleContext } from '@/context/folder-context';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function UnauthorizedDisplay() {
  const router = useRouter();
  const routerState = useRouterState();
  const currentRouteId = routerState.matches[routerState.matches.length - 1]?.routeId;
  const { settings, setHandle } = useContext(FolderHandleContext);

  return (
    <Card className="w-full max-w-screen-lg">
      <CardHeader className="flex flex-row w-full justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Program Access and Authorization</CardTitle>
          <CardDescription>You need to authorize the program to work with the desired local folder</CardDescription>
        </div>

        <BackButton />
      </CardHeader>

      <CardContent className="flex flex-col gap-1.5">
        <p>
          Web-apps need to have <span className="underline">explicit authorization</span> from users to access local
          folders. You must clearly and consistently endorse that you approve that the app do this each time it is
          loaded. You will be asked to authorize access <span className="underline">each time</span> time you re-start
          the program.
        </p>
        <p>
          Depending on your settings, you will have to select a folder named "DataTracker" to proceed. To authorize
          access to this folder, you will need to use the button featured below. Once authorized, you will see a change
          in the authorization status illustrated in the menubar.
        </p>
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
                  true,
                );
                return;
              }

              if (directory_picker) {
                setHandle(directory_picker);

                displayConditionalNotification(
                  settings,
                  'Access Authorized',
                  'You can now interact with files in the relevant folder.',
                );

                // Hack: do not like this
                await sleep(150);

                await router.invalidate({
                  filter: (match) => match.routeId === currentRouteId,
                  sync: true,
                  forcePending: true,
                });
              }
            } catch (error: unknown) {
              displayConditionalNotification(
                settings,
                'Error Authorizing Directory',
                error instanceof Error
                  ? error.message
                  : 'An unknown error occurred while trying to authorize the directory.',
                3000,
                true,
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
