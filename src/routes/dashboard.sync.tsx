import ViewSyncPage from '@/components/dashboard-sync/view-sync-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/sync')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ViewSyncPage />;
}
