import { groupQueryOptions } from '@/queries/groups/query-groups';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardGate } from '@/components/pages/dashboard-groups/dashboard-gate';

export const Route = createFileRoute('/dashboard/')({
  loader: ({ context }) => {
    const isAuthorized = context.folderHandleContext.handle !== null;

    if (!isAuthorized || !context.folderHandleContext.handle) {
      return {
        handle: null,
        isAuthorized,
      };
    }

    const fetchGroups = context.queryClient.fetchQuery(groupQueryOptions(context.folderHandleContext.handle));

    return {
      handle: context.folderHandleContext.handle,
      isAuthorized,
      fetchGroups,
      Settings: context.folderHandleContext.settings,
    };
  },
  component: DashboardGate,
});
