import PageWrapper from '@/components/elements/page-wrapper';
import ViewSyncPage from '@/components/pages/dashboard-sync/view-sync-page';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/sync')({
  beforeLoad: ({ context }) => {
    if (!context.folderHandleContext.isInitialized) {
      throw redirect({
        href: '/dashboard',
      });
    }

    if (!context.folderHandleContext.handle) {
      throw redirect({
        href: '/dashboard',
      });
    }

    return {
      settings: context.folderHandleContext.settings,
      handle: context.folderHandleContext.handle,
    };
  },
  loader({ context }) {
    return {
      Settings: context.folderHandleContext.settings,
      // Note: already screened
      handle: context.folderHandleContext.handle!,
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
