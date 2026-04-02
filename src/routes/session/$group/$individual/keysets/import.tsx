import { CleanUpString } from '@/lib/strings';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';
import ViewerKeysetPage from '@/components/pages/dashboard-keysets-import/viewer-keysets-page';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildKeysetBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import PageWrapper from '@/components/elements/page-wrapper';
import { keyboardsAllQueryOptions } from '@/queries/keysets/query-keyboards-all';
import { LoadingDisplay } from '@/components/elements/suspense/loading-display';
import { KeySetExtended } from '@/types/keyset/extended';

export const Route = createFileRoute('/session/$group/$individual/keysets/import')({
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
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
      CleanHandle: context.folderHandleContext.handle,
    };
  },
  loader: ({ context }) => {
    const { Group, Individual, CleanHandle } = context;

    const fetchAllKeysets = context.queryClient.fetchQuery(keyboardsAllQueryOptions(CleanHandle, Group, Individual));

    return {
      Group,
      Individual,
      CleanHandle,
      Settings: context.folderHandleContext.settings,
      fetchAllKeysets,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Settings, CleanHandle, fetchAllKeysets } = Route.useLoaderData();

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
        BuildKeysetBreadcrumb(Group, Individual),
      ]}
      label={'Keyset Import'}
      className="select-none"
      Settings={Settings}
    >
      <Await promise={fetchAllKeysets} fallback={<LoadingDisplay />}>
        {(keysets: KeySetExtended[]) => (
          <ViewerKeysetPage
            Group={Group}
            Individual={Individual}
            Handle={CleanHandle}
            Keysets={keysets}
            Settings={Settings}
          />
        )}
      </Await>
    </PageWrapper>
  );
}
