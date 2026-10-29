import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Edit2, ImportIcon, Plus } from 'lucide-react';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import BackButton from '@/components/ui/back-button';
import { ColumnDef } from '@tanstack/react-table';
import { KeySet } from '@/types/keyset/core';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTable } from '@/components/ui/data-table-common';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/dialogs/use-confirm-dialog';
import { useMutation } from '@tanstack/react-query';
import { mutationKeyboards } from '@/queries/keysets/mutate-keyboards';
import { queryClient } from '@/App';
import { Link, useRouter, useRouterState } from '@tanstack/react-router';
import { ApplicationSettingsTypes } from '@/types/settings/application-settings';
import { useNameDialog } from '@/components/dialogs/use-name-dialog';
import { RESERVED_STYLES_FILE_NAME } from '@/lib/reserved-names';

const KEYSET_RESERVED_NAMES = ['styles', RESERVED_STYLES_FILE_NAME];

export default function KeySetsPage({
  Group,
  Individual,
  KeySets,
  Settings,
  Handle,
}: {
  Group: string;
  Individual: string;
  KeySets: KeySet[];
  Settings: ApplicationSettingsTypes;
  Handle: FileSystemDirectoryHandle;
}) {
  const router = useRouter();
  const routerState = useRouterState();
  const currentRouteId = routerState.matches[routerState.matches.length - 1]?.routeId;

  const mutateKeyboards = useMutation({
    mutationFn: mutationKeyboards,
    onSuccess: async (data) => {
      queryClient.setQueryData(['/', Group, Individual, 'keyboards'], data);

      await queryClient.invalidateQueries({ queryKey: ['/', Group, 'metaKeyboards'] });
      await router.invalidate({
        filter: (match) =>
          match.routeId === currentRouteId || match.routeId === '/session/$group/$individual/keysets/import',
        sync: true,
        forcePending: true,
      });
    },
  });

  const { openNameDialog, nameDialog } = useNameDialog();
  const { openConfirmDialog, confirmDialog } = useConfirmDialog();

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
              className="shadow"
              onClick={() =>
                openNameDialog({
                  title: 'Duplicate KeySet',
                  description: `Creates a copy of "${row.original.Name}".`,
                  entityLabel: 'KeySet',
                  submitLabel: 'Duplicate',
                  initialValue: `${row.original.Name}_Copy`,
                  existingNames: KeySets.map((ks) => ks.Name),
                  reservedNames: KEYSET_RESERVED_NAMES,
                  onSubmit: (name) => {
                    toast.promise(
                      async () =>
                        await mutateKeyboards.mutateAsync({
                          Group,
                          Individual,
                          Keysets: [row.original.Name],
                          Rename: name,
                          Handle,
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
                  },
                })
              }
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
              <Button size={'sm'} variant={'outline'} className="shadow">
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
    <Card className="w-full max-w-(--breakpoint-2xl)">
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
          settings={Settings}
          columns={columns}
          data={KeySets}
          callback={(rows) => {
            const keySetNames = rows.map((k) => k.Name);

            openConfirmDialog({
              title: 'Delete KeySets',
              description: `Are you sure you want to delete ${keySetNames.length} KeySets? This CANNOT be undone.`,
              confirmLabel: 'Delete',
              destructive: true,
              onConfirm: () => {
                toast.promise(
                  async () =>
                    await mutateKeyboards.mutateAsync({
                      Group,
                      Individual,
                      Keysets: keySetNames,
                      Handle,
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
              },
            });
          }}
          filterCol="Name"
          optionalButtons={
            <div className="flex flex-row gap-2">
              <ToolTipWrapper Label="Create a new KeySet for individual">
                <Button
                  variant={'outline'}
                  className="shadow"
                  size={'sm'}
                  onClick={() =>
                    openNameDialog({
                      title: 'Create a New KeySet',
                      entityLabel: 'KeySet',
                      submitLabel: 'Create KeySet',
                      existingNames: KeySets.map((ks) => ks.Name),
                      reservedNames: KEYSET_RESERVED_NAMES,
                      onSubmit: (name) => {
                        toast.promise(
                          async () =>
                            await mutateKeyboards.mutateAsync({
                              Group,
                              Individual,
                              Keysets: [name],
                              Handle,
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
                      },
                    })
                  }
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
      {nameDialog}
      {confirmDialog}
    </Card>
  );
}
