import PageWrapper from '@/components/elements/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Edit2, ImportIcon, Plus } from 'lucide-react';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import BackButton from '@/components/ui/back-button';
import { ColumnDef } from '@tanstack/react-table';
import { KeySet } from '@/types/keyset';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTable } from '@/components/ui/data-table-common';
import { FolderHandleContext } from '@/context/folder-context';
import { toast } from 'sonner';
import { keyboardQueryOptions } from '@/queries/keysets/query-keyboards';
import { useMutation, useQuery } from '@tanstack/react-query';
import { mutationKeyboards } from '@/queries/keysets/mutate-keyboards';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { ErrorDisplay } from '@/components/suspense/error-display';
import { queryClient } from '@/App';
import { useContext } from 'react';
import { Link } from '@tanstack/react-router';

export default function KeySetsPage({ Group, Individual }: { Group: string; Individual: string }) {
  const Context = useContext(FolderHandleContext);
  const { handle } = Context;

  const { data, isLoading, error } = useQuery(keyboardQueryOptions(handle!, Group, Individual));

  const mutateKeyboards = useMutation({
    mutationFn: mutationKeyboards,
    onSuccess: (data) => {
      queryClient.setQueryData(['/', Group, Individual, 'keyboards'], data);
    },
  });

  if (isLoading) return <LoadingDisplay />;

  if (error || data == undefined) return <ErrorDisplay Text={'An error occurred while fetching keysets.'} />;

  const columns: ColumnDef<KeySet>[] = [
    {
      accessorKey: 'Name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Keyset Name" />,
      enableHiding: true,
    },
    {
      accessorKey: 'FrequencyKeys',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Frequency Keys" />,
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            {row.original.FrequencyKeys.map((key) => {
              return `${key.KeyDescription} (${key.KeyName.toUpperCase()})`;
            }).join(', ')}
          </div>
        );
      },
    },
    {
      accessorKey: 'DurationKeys',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Duration Keys" />,
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            {row.original.DurationKeys.map((key) => {
              return `${key.KeyDescription} (${key.KeyName.toUpperCase()})`;
            }).join(', ')}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date Created" />,
      cell: ({ row }) => {
        return <span>{new Date(row.original.createdAt).toLocaleDateString()}</span>;
      },
    },
    {
      accessorKey: 'Actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        return (
          <div className="flex flex-row justify-end gap-2">
            <Button
              size={'sm'}
              variant={'outline'}
              onClick={async () => {
                const new_key_set_name = window.prompt(
                  'Enter the name for the duplicated KeySet:',
                  `${row.original.Name}_Copy`,
                );

                if (!new_key_set_name) return;

                if (new_key_set_name.trim().length < 4) return;

                toast.promise(
                  async () =>
                    await mutateKeyboards.mutateAsync({
                      Group,
                      Individual,
                      Keysets: [row.original.Name],
                      Rename: new_key_set_name.trim(),
                      Handle: handle!,
                      Action: 'Duplicate',
                    }),
                  {
                    loading: 'Duplicating existing KeySet...',
                    success: () => {
                      return 'KeySet has been created successfully!';
                    },
                    error: () => {
                      return 'An error occurred while creating KeySet.';
                    },
                  },
                );
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Link
              to="/session/$group/$individual/keysets/$keyset"
              params={{
                group: Group,
                individual: Individual,
                keyset: row.original.Name,
              }}
            >
              <Button size={'sm'} variant={'outline'}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
      ]}
      label={'Keysets'}
      className="select-none"
    >
      <Card className="w-full max-w-screen-2xl">
        <CardHeader className="flex flex-col md:flex-row w-full justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Keyset Directory: {Individual}</CardTitle>
            <CardDescription>Create or Edit Current Keysets</CardDescription>
          </div>
          <div className="flex flex-row gap-2">
            <BackButton />
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-1.5">
          <p>
            This page lists various keysets that have been created for the client. Each keyset is a collection of keys
            that specify a key-behavior relationship. You must have at least <i>one</i> keyset to begin recording client
            data.
          </p>

          <DataTable
            settings={Context.settings}
            columns={columns}
            data={data}
            callback={(rows) => {
              const keySetNames = rows.map((k) => k.Name);

              const confirm_delete = window.confirm(
                `Are you sure you want to delete ${keySetNames.length} KeySets? This CANNOT be undone.`,
              );

              if (!confirm_delete) return;

              toast.promise(
                async () =>
                  await mutateKeyboards.mutateAsync({
                    Group,
                    Individual,
                    Keysets: keySetNames,
                    Handle: handle!,
                    Action: 'Delete',
                  }),
                {
                  loading: 'Deleting KeySet files...',
                  success: () => {
                    return 'KeySet files have been deleted successfully!';
                  },
                  error: () => {
                    return 'An error occurred while deleting KeySet files.';
                  },
                },
              );
            }}
            filterCol="Name"
            optionalButtons={
              <div className="flex flex-row gap-2">
                <ToolTipWrapper Label="Create a new KeySet for individual">
                  <Button
                    variant={'outline'}
                    className="shadow"
                    size={'sm'}
                    onClick={async () => {
                      const new_keyset_name = window && window.prompt('Enter the name of the keyset');

                      if (!new_keyset_name) return;

                      if (new_keyset_name.trim().length < 4) {
                        window.alert('Keyset name must be at least 4 characters long');
                        return;
                      }

                      const keySetMatch = data.find((ks) => ks.Name === new_keyset_name.trim());

                      if (keySetMatch) {
                        window.alert('A keyset with this name already exists. Please choose a different name.');
                        return;
                      }

                      toast.promise(
                        async () =>
                          await mutateKeyboards.mutateAsync({
                            Group,
                            Individual,
                            Keysets: [new_keyset_name.trim()],
                            Handle: handle!,
                            Action: 'Add',
                          }),
                        {
                          loading: 'Creating new KeySet',
                          success: () => {
                            return 'KeySet has been created successfully!';
                          },
                          error: () => {
                            return 'An error occurred while creating KeySet.';
                          },
                        },
                      );
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create
                  </Button>
                </ToolTipWrapper>
                <ToolTipWrapper Label="Import an existing KeySet for this client">
                  <Button variant={'outline'} className="shadow" size={'sm'}>
                    <Link
                      to="/session/$group/$individual/keysets/import"
                      params={{
                        group: Group,
                        individual: Individual,
                      }}
                      className="flex flex-row items-center"
                    >
                      <ImportIcon className="mr-2 h-4 w-4" />
                      Import
                    </Link>
                  </Button>
                </ToolTipWrapper>
              </div>
            }
          />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
