import PageWrapper from '@/components/elements/page-wrapper';
import { Route } from '@/routes/dashboard';
import UnauthorizedDisplay from './unauthorized-display';
import { LoadingDisplay } from '@/components/elements/suspense/loading-display';
import AuthorizedDisplayContent from './authorized-display-content';
import { Await } from '@tanstack/react-router';

export function DashboardGate() {
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
