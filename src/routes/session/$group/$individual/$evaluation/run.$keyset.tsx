import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';
import SessionRecorderPage from '@/components/pages/session-recorder/session-recorder-page';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/run/$keyset')({
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

    const { group, individual, evaluation, keyset } = params;

    if (!group || !individual || !evaluation || !keyset) {
      throw redirect({
        to: '/dashboard',
      });
    }

    return {
      cleanHandle: context.folderHandleContext.handle,
      group: CleanUpString(group),
      individual: CleanUpString(individual),
      evaluation: CleanUpString(evaluation),
      keyset: CleanUpString(keyset),
    };
  },
  loader: ({ context }) => {
    const { group, individual, evaluation, keyset } = context;

    return {
      Group: group,
      Individual: individual,
      Evaluation: evaluation,
      Keyset: keyset,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, Keyset } = Route.useLoaderData();

  return <SessionRecorderPage Group={Group} Individual={Individual} Evaluation={Evaluation} KeySet={Keyset} />;
}
