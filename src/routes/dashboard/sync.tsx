import { createFileRoute } from '@tanstack/react-router';
import ViewSyncPage from './-components/sync/view-sync-page';

export const Route = createFileRoute('/dashboard/sync')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ViewSyncPage />;
}
