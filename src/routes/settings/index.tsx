import SettingsPage from '@/components/pages/editor-settings/settings-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/')({
  component: SettingsPage,
});
