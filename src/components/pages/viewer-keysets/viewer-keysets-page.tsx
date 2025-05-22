import PageWrapper from '@/components/layout/page-wrapper';
import BackButton from '@/components/ui/back-button';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
  BuildKeysetBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingDisplay from '@/components/ui/loading-display';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FolderHandleContextType } from '@/context/folder-context';
import { useQueryKeyboardsMetaFixed } from '@/hooks/keyboards/useQueryKeyboardsMeta';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { ImportIcon } from 'lucide-react';
import { redirect, useLoaderData } from 'react-router-dom';

type LoaderResult = {
  Group: string;
  Individual: string;
  Handle: FileSystemHandle;
  Context: FolderHandleContextType;
};

export const keysetsPageLoader = (ctx: FolderHandleContextType) => {
  const { handle } = ctx;

  // @ts-ignore
  return async ({ params, request }) => {
    const { Group, Individual } = params;

    if (!Group || !Individual || !handle) {
      const response = redirect(createHref({ type: 'Dashboard' }));
      throw response;
    }

    return {
      Group: CleanUpString(Group),
      Individual: CleanUpString(Individual),
      Handle: handle,
      Context: ctx,
    } satisfies LoaderResult;
  };
};

export default function ViewerKeysetPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Context } = loaderResult;
  const { data, status, error, importExistingKeyset } = useQueryKeyboardsMetaFixed(Group, Individual, Context);

  if (status === 'loading') {
    return <LoadingDisplay />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
        BuildKeysetBreadcrumb(Group, Individual),
      ]}
      label={'Keyset Import'}
      className="select-none"
    >
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex flex-col gap-1.5 grow">
            <CardTitle>Keyset Import</CardTitle>
            <CardDescription>Import a keyset file to use in your evaluations.</CardDescription>
          </div>
          <BackButton Label="Back" />
        </CardHeader>

        <CardContent className="flex flex-col gap-1.5">
          <p>
            This page lists keysets that have been created for those <i>other than</i> the current client. Each keyset
            is a collection of keys that specify a key-behavior relationship.
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Individual</TableHead>
                <TableHead>Keyset Name</TableHead>
                <TableHead>Duration Keys</TableHead>
                <TableHead>Frequency Keys</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((keyset) => {
                const { Group: grp1, Individual: ind1, ...rest } = keyset;

                const string_duration_keys = keyset.DurationKeys.map((key) => {
                  return `${key.KeyDescription} (${key.KeyName.toUpperCase()})`;
                }).join(', ');

                const string_frequency_keys = keyset.FrequencyKeys.map((key) => {
                  return `${key.KeyDescription} (${key.KeyName.toUpperCase()})`;
                }).join(', ');

                return (
                  <TableRow key={keyset.id}>
                    <TableCell>{grp1}</TableCell>
                    <TableCell>{ind1}</TableCell>
                    <TableCell>{keyset.Name}</TableCell>
                    <TableCell>{string_duration_keys}</TableCell>
                    <TableCell>{string_frequency_keys}</TableCell>
                    <TableCell>
                      <Button
                        variant={'outline'}
                        className="w-full"
                        onClick={async () => {
                          await importExistingKeyset(rest);
                        }}
                      >
                        <ImportIcon className="h-4 w-4 mr-2" />
                        Import
                      </Button>
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
