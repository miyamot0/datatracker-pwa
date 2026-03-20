import { Await, createFileRoute, redirect } from '@tanstack/react-router';
import { CleanUpString } from '@/lib/strings';
import KeySetsPage from '@/components/pages/dashboard-keysets/keysets-page';
import PageWrapper from '@/components/elements/page-wrapper';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { keyboardQueryOptions } from '@/queries/keysets/query-keyboards';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { KeySet } from '@/types/keyset';

export const Route = createFileRoute('/session/$group/$individual/keysets/')({
  beforeLoad: ({ context, params }) => {
    if (!context.folderHandleContext.isInitialized) {
      throw redirect({
        href: '/',
      });
    }

    if (!context.folderHandleContext.handle) {
      throw redirect({
        to: '/dashboard',
      });
    }

    const { group, individual } = params;

    if (!group || !individual) {
      throw redirect({
        to: '/dashboard',
      });
    }

    return {
      CleanHandle: context.folderHandleContext.handle,
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
    };
  },
  loader: ({ context }) => {
    const { Group, Individual, CleanHandle } = context;

    const fetchKeySets = context.queryClient.fetchQuery(keyboardQueryOptions(CleanHandle, Group, Individual));

    return {
      Group,
      Individual,
      CleanHandle,
      Settings: context.folderHandleContext.settings,
      fetchKeySets,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, CleanHandle, Settings, fetchKeySets } = Route.useLoaderData();

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
      ]}
      label={'Keysets'}
      className="select-none"
      Settings={Settings}
    >
      <Await promise={fetchKeySets} fallback={<LoadingDisplay />}>
        {(keysets: KeySet[]) => (
          <KeySetsPage
            Group={Group}
            Individual={Individual}
            KeySets={keysets}
            Settings={Settings}
            Handle={CleanHandle}
          />
        )}
      </Await>
    </PageWrapper>
  );
}
