import { queryClient } from '@/App';
import PageWrapper from '@/components/elements/page-wrapper';
import { LoadingDisplay } from '@/components/suspense/loading-display';
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
import { FolderHandleContext } from '@/context/folder-context';
import { mutateKeyboardsAll } from '@/queries/keysets/mutate-keyboards-all';
import { keyboardsAllQueryOptions } from '@/queries/keysets/query-keyboards-all';
import { KeySet, KeySetInstance } from '@/types/keyset';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { ImportIcon } from 'lucide-react';
import { useContext } from 'react';
import { toast } from 'sonner';

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

export default function ViewerKeysetPage({ Group, Individual }: { Group: string; Individual: string }) {
  const Context = useContext(FolderHandleContext);
  const { handle } = Context;

  const { data, isLoading, error } = useQuery(keyboardsAllQueryOptions(handle!, Group, Individual));

  const mutateKeyboardsGlobal = useMutation({
    mutationFn: mutateKeyboardsAll,
    onSuccess: async (data) => {
      queryClient.setQueryData(['/', Group, 'metaKeyboards'], data);
      await queryClient.invalidateQueries({ queryKey: ['/', Group, Individual, 'keyboards'] });
    },
  });

  if (isLoading) {
    return <LoadingDisplay />;
  }

  if (error || !data) {
    return <div>{error?.message}</div>;
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
          <BackButton />
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

              toast.promise(
                async () =>
                  await mutateKeyboardsGlobal.mutateAsync({
                    Handle: handle!,
                    Group,
                    Individual,
                    KeySets: keysetsToImport,
                  }),
                {
                  loading: 'Importing keyset...',
                  success: () => {
                    return 'KeySets have been imported successfully!';
                  },
                  error: (e: Error) => {
                    return `An error occurred while importing KeySets: ${e.message}.`;
                  },
                },
              );
            }}
          />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
