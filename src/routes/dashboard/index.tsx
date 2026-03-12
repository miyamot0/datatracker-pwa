import DashboardPage from '@/components/pages/dashboard-group/dashboard-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <DashboardPage />;
}
