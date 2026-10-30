import HomePage from '@/components/pages/home/home-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  loader: ({ context }) => {
    return {
      Settings: context.folderHandleContext.settings,
    };
  },
  component: HomePage,
});
