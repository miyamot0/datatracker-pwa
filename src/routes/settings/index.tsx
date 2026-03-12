import { createFileRoute } from '@tanstack/react-router';
import SettingsPage from './-components/settings-page';

export const Route = createFileRoute('/settings/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <SettingsPage />;
}
