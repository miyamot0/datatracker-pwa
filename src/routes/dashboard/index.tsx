import PageWrapper from '@/components/elements/page-wrapper';
import AuthorizedDisplayContent from '@/components/pages/dashboard-groups/authorized-display-content';
import UnauthorizedDisplay from '@/components/pages/dashboard-groups/unauthorized-display';
import { LoadingDisplay } from '@/components/elements/suspense/loading-display';
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
      Settings: context.folderHandleContext.settings,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { handle, isAuthorized, fetchGroups, Settings } = Route.useLoaderData();

  if (!isAuthorized || !handle) {
    return (
      <PageWrapper label={'Folder Authorization'} className="select-none">
        <UnauthorizedDisplay />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper label={'Group Dashboard'} className="select-none" Settings={Settings}>
      <Await promise={fetchGroups} fallback={<LoadingDisplay />}>
        {(groups: string[]) => <AuthorizedDisplayContent Groups={groups} Settings={Settings} Handle={handle} />}
      </Await>
    </PageWrapper>
  );
}
