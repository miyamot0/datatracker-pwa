import { queryClient } from '@/App';
import BackButton from '@/components/ui/back-button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table-common';
import { CleanUpString } from '@/lib/strings';
import { mutationIndividuals } from '@/queries/individuals/mutate-individuals';
import { ApplicationSettingsTypes } from '@/types/settings/application-settings';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { toast } from 'sonner';
import { buildClientColumns } from './views/clients-columns';
import CreateClientButton from './views/create-client-button';

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
  const routerState = useRouterState();
  const currentRouteId = routerState.matches[routerState.matches.length - 1]?.routeId;

  const mutateIndividuals = useMutation({
    mutationFn: mutationIndividuals,
    onSuccess: async (data) => {
      queryClient.setQueryData(['/', Group], data);

      await router.invalidate({
        filter: (match) => match.routeId === currentRouteId,
        sync: true,
      });
    },
  });

  const columns = buildClientColumns({ Group, Clients, Handle, Settings });

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
          optionalButtons={<CreateClientButton Group={Group} Clients={Clients} Handle={Handle} />}
        />
      </CardContent>
    </Card>
  );
}
