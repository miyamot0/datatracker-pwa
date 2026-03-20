import { Await, createFileRoute, redirect } from '@tanstack/react-router';
import { CleanUpString } from '@/lib/strings';
import ClientsPage from '@/components/pages/dashboard-participants/clients-page';
import PageWrapper from '@/components/elements/page-wrapper';
import { BuildGroupBreadcrumb } from '@/components/ui/breadcrumb-entries';
import { clientQueryOptions } from '@/queries/individuals/query-individuals';
import { LoadingDisplay } from '@/components/suspense/loading-display';

export const Route = createFileRoute('/session/$group/')({
  beforeLoad: ({ context, params }) => {
    if (!context.folderHandleContext.isInitialized) {
      throw redirect({
        href: '/',
      });
    }

    if (!context.folderHandleContext.handle) {
      throw redirect({
        to: '/dashboard',
      });
    }

    const { group } = params;

    if (!group) {
      throw redirect({
        to: '/dashboard',
      });
    }

    return {
      Group: CleanUpString(group),
      CleanHandle: context.folderHandleContext.handle,
    };
  },
  loader: ({ params, context }) => {
    const { Group, CleanHandle } = context;

    const fetchClients = context.queryClient.fetchQuery(clientQueryOptions(CleanHandle, Group));

    return {
      Group: params.group,
      Settings: context.folderHandleContext.settings,
      CleanHandle,
      fetchClients,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Settings, CleanHandle, fetchClients } = Route.useLoaderData();

  return (
    <PageWrapper
      breadcrumbs={[BuildGroupBreadcrumb()]}
      label={CleanUpString(Group)}
      Settings={Settings}
      className="select-none"
    >
      <Await promise={fetchClients} fallback={<LoadingDisplay />}>
        {(clients: string[]) => (
          <ClientsPage Group={Group} Clients={clients} Handle={CleanHandle} Settings={Settings} />
        )}
      </Await>
    </PageWrapper>
  );
}
