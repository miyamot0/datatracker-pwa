import PageWrapper from '@/components/elements/page-wrapper';
import KeySetEditor from '@/components/pages/editor-keyset/keyset-editor';
import { LoadingDisplay } from '@/components/elements/suspense/loading-display';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
  BuildKeysetBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { CleanUpString } from '@/lib/strings';
import { keyboardQueryOptions } from '@/queries/keysets/query-keyboards';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';
import { type KeySet } from '@/types/keyset/core';
import { ErrorDisplay } from '@/components/elements/suspense/error-display';

export const Route = createFileRoute('/session/$group/$individual/keysets/$keyset/')({
  beforeLoad: ({ params, context }) => {
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

    const { group, individual, keyset } = params;

    if (!group || !individual || !keyset) {
      throw redirect({
        to: '/dashboard',
      });
    }

    return {
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
      KeySet: CleanUpString(keyset),
      CleanHandle: context.folderHandleContext.handle,
    };
  },
  loader: ({ context }) => {
    const { Group, Individual, KeySet, CleanHandle } = context;

    const fetchKeyboards = context.queryClient.fetchQuery(keyboardQueryOptions(CleanHandle, Group, Individual));

    return {
      Group: Group,
      Individual: Individual,
      KeySet: KeySet,
      CleanHandle: CleanHandle,
      Settings: context.folderHandleContext.settings,
      fetchKeyboards,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, KeySet, CleanHandle, fetchKeyboards } = Route.useLoaderData();

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
        BuildKeysetBreadcrumb(Group, Individual),
      ]}
      label={CleanUpString(KeySet)}
      className="select-none"
    >
      <Await promise={fetchKeyboards} fallback={<LoadingDisplay />}>
        {(keysets: KeySet[]) => {
          const relevantKeySet = keysets.find((ks) => ks.Name === KeySet);

          if (!relevantKeySet) return <ErrorDisplay Text="KeySet not found" />;

          return (
            <KeySetEditor Group={Group} Individual={Individual} KeySetObject={relevantKeySet} Handle={CleanHandle} />
          );
        }}
      </Await>
    </PageWrapper>
  );
}
