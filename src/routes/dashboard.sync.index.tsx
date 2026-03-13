import ViewSyncPage from '@/components/dashboard-sync/view-sync-page';
import { routeGuard } from '@/lib/routing';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/sync/')({ beforeLoad: routeGuard, component: RouteComponent });

function RouteComponent() {
  return <ViewSyncPage />;
}
