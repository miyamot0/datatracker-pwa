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
      settings: context.folderHandleContext.settings,
      // Note: already screened
      handle: context.folderHandleContext.handle!,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { settings, handle } = Route.useLoaderData();

  return <ViewSyncPage Settings={settings} Handle={handle} />;
}
