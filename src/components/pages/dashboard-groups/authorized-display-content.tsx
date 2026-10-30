import BackButton from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseIcon, FolderInput, FolderPlus } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mutationGroups } from '@/queries/groups/mutate-groups';
import { Link, useRouter, useRouterState } from '@tanstack/react-router';
import { DataTable } from '@/components/ui/data-table-common';
import { DemoDataFolderName } from '@/lib/query-mutate';
import { ApplicationSettingsTypes } from '@/types/settings/application-settings';
import { useNameDialog } from '@/components/dialogs/use-name-dialog';
import { useConfirmDialog } from '@/components/dialogs/use-confirm-dialog';

type Props = {
  Groups: string[];
  Settings: ApplicationSettingsTypes;
  Handle: FileSystemDirectoryHandle;
};

type GroupTableRow = {
  Group: string;
};

export default function AuthorizedDisplayContent({ Groups, Settings, Handle }: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const routerState = useRouterState();
  const currentRouteId = routerState.matches[routerState.matches.length - 1]?.routeId;

  const mutateGroups = useMutation({
    mutationFn: mutationGroups,
    onSuccess: async (data) => {
      queryClient.setQueryData(['/'], data);

      await router.invalidate({
        filter: (match) => match.routeId === currentRouteId,
        sync: true,
      });
    },
  });

  const { openNameDialog, nameDialog } = useNameDialog();
  const { openConfirmDialog, confirmDialog } = useConfirmDialog();

  const columns: ColumnDef<GroupTableRow>[] = [
    {
      accessorKey: 'Group',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Client Group Folder" />,
    },
    {
      accessorKey: 'Actions',
      header: () => <div className="text-right whitespace-nowrap">Group Folder Actions</div>,
      cell: ({ row }) => (
        <div className="flex flex-row justify-end">
          <Button size={'sm'} variant={'outline'} className="flex flex-row divide-x justify-between mx-0 px-0 shadow">
            <Link
              className="px-3 hover:underline flex flex-row items-center"
              to="/session/$group"
              params={{ group: row.original.Group }}
            >
              <FolderInput className="mr-2 h-4 w-4" />
              Open Group
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="w-full max-w-(--breakpoint-2xl)">
      <CardHeader className="flex flex-col md:flex-row w-full justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Directory of Groups</CardTitle>
          <CardDescription>Open Group to Load Relevant Client Data</CardDescription>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <BackButton />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-1.5">
        <p>
          Each entry in this page represents a 'Grouping' of individuals. The specific grouping does not change any
          functionality provided; however, this helps with organizing the collection and review of data. You must have
          at least <i>one</i> group to begin collecting data.
        </p>

        <DataTable
          settings={Settings}
          columns={columns}
          data={Groups.map((g) => {
            return { Group: g };
          })}
          callback={(rows) => {
            const groupNames = rows.map((row) => row.Group);

            openConfirmDialog({
              title: 'Delete Groups',
              description: `Are you sure you want to delete ${groupNames.length} groups? This CANNOT be undone.`,
              confirmLabel: 'Delete',
              destructive: true,
              onConfirm: () => {
                toast.promise(
                  async () =>
                    await mutateGroups.mutateAsync({
                      Group: groupNames,
                      Handle: Handle,
                      Action: 'Delete',
                    }),
                  {
                    loading: 'Removing group folders...',
                    success: () => {
                      return 'Group folders removed.';
                    },
                    error: (e: Error) => {
                      return `Group folders were not removed: ${e.message}`;
                    },
                  },
                );
              },
            });
          }}
          filterCol="Group"
          optionalButtons={
            <>
              <Button
                variant={'outline'}
                size={'sm'}
                className="shadow"
                onClick={() =>
                  openConfirmDialog({
                    title: 'Extract Example Folder',
                    description: `This will create an ${DemoDataFolderName} folder for you. Do you wish to proceed?`,
                    confirmLabel: 'Extract',
                    onConfirm: () => {
                      toast.promise(
                        async () =>
                          mutateGroups.mutateAsync({
                            Group: [DemoDataFolderName],
                            Handle: Handle,
                            Action: 'Demo',
                          }),
                        {
                          loading: 'Writing example data to disk...',
                          success: () => {
                            return 'Example data has been added! Create a separate "DataTracker" folder elsewhere on your disk to explore "Sync" functionality';
                          },
                          error: (e: Error) => {
                            return `Files were not written to disk: ${e.message}`;
                          },
                        },
                      );
                    },
                  })
                }
              >
                <DatabaseIcon className="mr-2 h-4 w-4" />
                Extract Example Folder
              </Button>

              <Button
                variant={'outline'}
                size={'sm'}
                className="shadow"
                onClick={() =>
                  openNameDialog({
                    title: 'Create a New Group',
                    entityLabel: 'Group',
                    submitLabel: 'Create group',
                    existingNames: Groups,
                    onSubmit: (name) => {
                      toast.promise(
                        async () =>
                          await mutateGroups.mutateAsync({
                            Group: [name],
                            Handle: Handle,
                            Action: 'Add',
                          }),
                        {
                          loading: 'Creating folders...',
                          success: () => {
                            return 'New folder created.';
                          },
                          error: (e: Error) => {
                            return `Folder was not created: ${e.message}.`;
                          },
                        },
                      );
                    },
                  })
                }
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Create
              </Button>
            </>
          }
        />
      </CardContent>
      {nameDialog}
      {confirmDialog}
    </Card>
  );
}
