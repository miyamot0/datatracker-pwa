import PageWrapper from '@/components/elements/page-wrapper';
import ViewSyncPage from '@/components/pages/dashboard-sync/view-sync-page';
import { createFileRoute } from '@tanstack/react-router';
import { routeGuard } from '@/lib/routing';

export const Route = createFileRoute('/dashboard/sync')({
  beforeLoad: ({ context }) => {
    const guarded = routeGuard({ context });

    return {
      settings: guarded.settings,
      handle: guarded.handle,
    };
  },
  loader({ context }) {
    return {
      Settings: context.settings,
      handle: context.handle,
    };
  },
  component: RouteComponent,
  // Note: Assume always changing
  staleTime: 0,
  gcTime: 0,
});

function RouteComponent() {
  const { Settings, handle } = Route.useLoaderData();

  return (
    <PageWrapper breadcrumbs={[]} label={'File Sync'} className="select-none" Settings={Settings}>
      <ViewSyncPage Settings={Settings} Handle={handle} />
    </PageWrapper>
  );
}
