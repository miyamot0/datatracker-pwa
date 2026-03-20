import PageWrapper from '@/components/elements/page-wrapper';
import AuthorizedDisplayContent from '@/components/pages/dashboard-groups/gated-displays/authorized-display-content';
import UnauthorizedDisplay from '@/components/pages/dashboard-groups/gated-displays/unauthorized-display';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { groupQueryOptions } from '@/queries/groups/query-groups';
import { Await, createFileRoute } from '@tanstack/react-router';

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
      settings: context.folderHandleContext.settings,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { handle, isAuthorized, fetchGroups, settings } = Route.useLoaderData();

  if (!isAuthorized || !handle) {
    return (
      <PageWrapper label={'Folder Authorization'} className="select-none">
        <UnauthorizedDisplay />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper label={'Group Dashboard'} className="select-none">
      <Await promise={fetchGroups} fallback={<LoadingDisplay />}>
        {(groups: string[]) => <AuthorizedDisplayContent Groups={groups} Settings={settings} Handle={handle} />}
      </Await>
    </PageWrapper>
  );
}
