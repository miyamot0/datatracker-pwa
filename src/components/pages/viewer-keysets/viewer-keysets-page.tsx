import PageWrapper from '@/components/layout/page-wrapper';
import BackButton from '@/components/ui/back-button';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
  BuildKeysetBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTable } from '@/components/ui/data-table-common';
import LoadingDisplay from '@/components/ui/loading-display';
import { FolderHandleContextType } from '@/context/folder-context';
import { useQueryKeyboardsMetaFixed } from '@/hooks/keyboards/useQueryKeyboardsMeta';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { KeySet, KeySetInstance } from '@/types/keyset';
import { ColumnDef } from '@tanstack/react-table';
import { ImportIcon } from 'lucide-react';
import { redirect, useLoaderData } from 'react-router-dom';
import { toast } from 'sonner';

type LoaderResult = {
  Group: string;
  Individual: string;
  Handle: FileSystemHandle;
  Context: FolderHandleContextType;
};

// eslint-disable-next-line react-refresh/only-export-components
export const keysetsPageLoader = (ctx: FolderHandleContextType) => {
  const { handle } = ctx;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async ({ params }: any) => {
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

type KeySetImportDisplayType = {
  Group: string;
  Individual: string;
  Name: string;
  DurationKeys: string;
  FrequencyKeys: string;
  OriginalKeyset: KeySet;
};

const remapKeysToString = (keys: KeySetInstance[]) => {
  return keys
    .map((key) => {
      return `${key.KeyDescription} (${key.KeyName.toUpperCase()})`;
    })
    .join(', ');
};

export default function ViewerKeysetPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Context } = loaderResult;
  const { data, status, error, importExistingKeysets } = useQueryKeyboardsMetaFixed(Group, Individual, Context);

  if (status === 'loading') {
    return <LoadingDisplay />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const dataToDisplay: KeySetImportDisplayType[] = data.map((record) => {
    return {
      Group: record.Group,
      Individual: record.Individual,
      Name: record.Name,
      DurationKeys: remapKeysToString(record.DurationKeys),
      FrequencyKeys: remapKeysToString(record.FrequencyKeys),
      OriginalKeyset: record,
    };
  });

  const columns: ColumnDef<KeySetImportDisplayType>[] = [
    {
      accessorKey: 'Group',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Group" />,
    },
    {
      accessorKey: 'Individual',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Individual" />,
    },
    {
      accessorKey: 'Name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="KeySet Name" />,
    },

    {
      accessorKey: 'DurationKeys',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Duration Keys" />,
    },

    {
      accessorKey: 'FrequencyKeys',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Frequency Keys" />,
    },
  ];

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

          <DataTable
            settings={Context.settings}
            columns={columns}
            data={dataToDisplay}
            forceShowCheckbox
            filterCol="Name"
            customCheckboxButton={
              <>
                <ImportIcon className="h-4 w-4 mr-2" />
                Import KeySet(s)
              </>
            }
            callback={(rows) => {
              const keysetsToImport = rows.map((row) => row.OriginalKeyset);

              toast.promise(async () => await importExistingKeysets(keysetsToImport), {
                loading: 'Deleting client folders...',
                success: () => {
                  return 'Client folders have been deleted successfully!';
                },
                error: () => {
                  return 'An error occurred while deleting client folders.';
                },
              });
            }}
          />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
