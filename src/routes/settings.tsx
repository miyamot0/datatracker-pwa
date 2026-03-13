import SettingsPage from '@/components/app-settings/settings-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings')({
  component: RouteComponent,
});

function RouteComponent() {
  return <SettingsPage />;
}
