import { groupQueryOptions } from '@/queries/groups/query-groups';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardGate } from '@/components/pages/dashboard-groups/dashboard-gate';

import { trackSettlement } from '@/lib/settle-tracking';

export const Route = createFileRoute('/dashboard/')({
  loader: ({ context }) => {
    const handle = context.folderHandleContext.handle;
    const isAuthorized = Boolean(handle);

    const Settings = context.folderHandleContext.settings;

    if (!handle) {
      return {
        handle: null,
        isAuthorized,
        Settings,
      };
    }

    const fetchGroups = trackSettlement(context.queryClient.query(groupQueryOptions(handle)));

    return {
      handle,
      isAuthorized,
      fetchGroups,
      Settings,
    };
  },
  component: DashboardGate,
});
