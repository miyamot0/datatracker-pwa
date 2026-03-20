import { queryClient } from '@/App';
import BackButton from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTable } from '@/components/ui/data-table-common';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { mutationIndividuals } from '@/queries/individuals/mutate-individuals';
import { ApplicationSettingsTypes } from '@/types/settings';
import { useMutation } from '@tanstack/react-query';
import { Link, useRouter } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { FolderInput, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';

type ClientTableRow = {
  Individual: string;
};

export default function ClientsPage({
  Group,
  Clients,
  Handle,
  Settings,
}: {
  Group: string;
  Clients: string[];
  Handle: FileSystemDirectoryHandle;
  Settings: ApplicationSettingsTypes;
}) {
  const router = useRouter();

  const mutateIndividuals = useMutation({
    mutationFn: mutationIndividuals,
    onSuccess: async (data) => {
      queryClient.setQueryData(['/', Group], data);
    },
  });

  const columns: ColumnDef<ClientTableRow>[] = [
    {
      accessorKey: 'Individual',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Client Name/ID" />,
    },
    {
      accessorKey: 'Actions',
      header: () => <div className="text-right">Client Folder Actions</div>,
      cell: ({ row }) => (
        <div className="flex flex-row justify-end">
          <Button size={'sm'} variant={'outline'} className="flex flex-row divide-x justify-between mx-0 px-0 shadow">
            <Link
              className="px-3 hover:underline flex flex-row items-center"
              to={createHref({
                type: 'Evaluations',
                group: Group,
                individual: row.original.Individual,
              })}
            >
              <FolderInput className="mr-2 h-4 w-4" />
              Open Evaluations
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="w-full max-w-screen-2xl">
      <CardHeader className="flex flex-col md:flex-row w-full justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Client Directory: {CleanUpString(Group)}</CardTitle>
          <CardDescription>Select clients to develop and evaluate outcomes</CardDescription>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <BackButton />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-1.5">
        <p>
          Each of the entries in the table below represent individual clients. You must have at least <i>one</i> client
          added to the group before you can begin collecting data (e.g., designing evaluations, adding conditions in
          evaluations).
        </p>

        <DataTable
          settings={Settings}
          columns={columns}
          data={Clients.map((g) => {
            return { Individual: g };
          })}
          callback={(rows) => {
            const individualNames = rows.map((row) => row.Individual);

            const confirm_delete = window.confirm(
              `Are you sure you want to delete ${individualNames.length} client(s)? This CANNOT be undone.`,
            );

            if (!confirm_delete) {
              return;
            }

            toast.promise(
              async () =>
                await mutateIndividuals.mutateAsync({
                  Group,
                  Individuals: individualNames,
                  Handle,
                  Action: 'Delete',
                }),
              {
                loading: 'Deleting client folders...',
                success: () => {
                  return 'Client folders have been deleted successfully!';
                },
                error: (e: Error) => {
                  return `An error occurred while deleting client folders: ${e.message}.`;
                },
              },
            );
          }}
          filterCol="Individual"
          optionalButtons={
            <ToolTipWrapper Label="Add a new client to current group">
              <Button
                variant={'outline'}
                className="shadow"
                size={'sm'}
                onClick={async () => {
                  const input = window.prompt('Enter a name for the new group.');

                  if (!input) return;

                  if (Clients.includes(input.trim())) {
                    window.alert('Client already exists.');
                    return;
                  }

                  if (input.trim().length < 4) {
                    window.alert('Client name must be at least 4 characters long.');
                    return;
                  }

                  toast.promise(
                    async () =>
                      await mutateIndividuals.mutateAsync({
                        Group,
                        Individuals: [input.trim()],
                        Handle,
                        Action: 'Add',
                      }),
                    {
                      loading: 'Creating individual folders...',
                      success: () => {
                        return 'New individual folder created!';
                      },
                      error: (e: Error) => {
                        return `An error occurred while adding individual folder: ${e.message}.`;
                      },
                    },
                  );
                }}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Create
              </Button>
            </ToolTipWrapper>
          }
        />
      </CardContent>
    </Card>
  );
}
