import { DiagnosticsPage } from '@/components/pages/diagnostics/diagnostics-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/diagnostics/')({
  loader: ({ context }) => {
    return {
      Settings: context.folderHandleContext.settings,
      queryClient: context.queryClient,
    };
  },
  component: DiagnosticsPage,
});
