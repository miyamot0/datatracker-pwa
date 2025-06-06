import PageWrapper from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import DurationDialogKeyCreator from './dialogs/duration-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FrequencyDialogKeyCreator from './dialogs/frequency-dialog';
import { DeleteIcon } from 'lucide-react';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildKeysetBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { redirect, useLoaderData } from 'react-router-dom';
import { CleanUpString } from '@/lib/strings';
import { useQuerySingleKeyboardFixed } from '@/hooks/keyboards/useQuerySingleKeyboard';
import LoadingDisplay from '@/components/ui/loading-display';
import createHref from '@/lib/links';
import BackButton from '@/components/ui/back-button';
import { FolderHandleContextType } from '@/context/folder-context';

type LoaderResult = {
  Group: string;
  Individual: string;
  KeySet: string;
  Handle: FileSystemHandle;
  Context: FolderHandleContextType;
};

// eslint-disable-next-line react-refresh/only-export-components
export const keysetEditorPageLoader = (ctx: FolderHandleContextType) => {
  const { handle } = ctx;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async ({ params }: any) => {
    const { Group, Individual, KeySet } = params;

    if (!Group || !Individual || !KeySet || !handle) {
      const response = redirect(createHref({ type: 'Dashboard' }));
      throw response;
    }

    return {
      Group: CleanUpString(Group),
      Individual: CleanUpString(Individual),
      KeySet: CleanUpString(KeySet),
      Handle: handle,
      Context: ctx,
    } satisfies LoaderResult;
  };
};

export default function KeySetEditor() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, KeySet, Context } = loaderResult;

  const { data, error, status, handle, mutateKeySet, addKeyCallback } = useQuerySingleKeyboardFixed(
    Group,
    Individual,
    KeySet,
    Context
  );

  if (status === 'loading') {
    return <LoadingDisplay />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!Group || !Individual || !KeySet || !handle || !data) {
    throw new Error('Params missing.');
  }

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
        BuildKeysetBreadcrumb(Group, Individual),
      ]}
      label={CleanUpString(KeySet)}
      className="select-none"
    >
      <div className="w-full max-w-screen-2xl grid grid-cols-2 gap-2">
        <Card className="w-full flex flex-col justify-between">
          <CardHeader className="flex flex-col md:flex-row justify-between">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Frequency Keys</CardTitle>
              <CardDescription>Manage Frequency Keys</CardDescription>
            </div>

            <div className="flex flex-row gap-2">
              <FrequencyDialogKeyCreator KeySet={data} Callback={addKeyCallback} />

              <BackButton Label="Back" />
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead className="w-[50px] text-right">Editor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.FrequencyKeys.map((key, index) => (
                  <TableRow key={index}>
                    <TableCell>{key.KeyDescription}</TableCell>
                    <TableCell>{key.KeyName}</TableCell>
                    <TableCell>
                      <Button
                        size={'sm'}
                        variant={'destructive'}
                        className="shadow-xl"
                        onClick={() => {
                          const confirmation = window.confirm('Are you sure you want to remove this key?');

                          if (!confirmation) return;

                          const new_state = {
                            ...data,
                            FrequencyKeys: data.FrequencyKeys.filter((_key) => _key.KeyCode !== key.KeyCode),
                          };

                          mutateKeySet(new_state);
                        }}
                      >
                        <DeleteIcon className="mr-2" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="w-full flex flex-col justify-between">
          <CardHeader className="flex flex-col md:flex-row justify-between">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Duration Keys</CardTitle>
              <CardDescription>Manage Duration Keys</CardDescription>
            </div>

            <div className="flex flex-row gap-2">
              <DurationDialogKeyCreator KeySet={data} Callback={addKeyCallback} />

              <BackButton Label="Back" />
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead className="w-[50px] text-right">Editor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.DurationKeys.map((key, index) => (
                  <TableRow key={index}>
                    <TableCell>{key.KeyDescription}</TableCell>
                    <TableCell>{key.KeyName}</TableCell>
                    <TableCell>
                      <Button
                        size={'sm'}
                        variant={'destructive'}
                        onClick={() => {
                          const confirmation = window.confirm('Are you sure you want to remove this key?');

                          if (!confirmation) return;

                          const new_state = {
                            ...data,
                            DurationKeys: data.DurationKeys.filter((_key) => _key.KeyCode !== key.KeyCode),
                          };

                          mutateKeySet(new_state);
                        }}
                      >
                        <DeleteIcon className="mr-2" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
