import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';
import SessionManagerPage from '@/components/pages/editor-session-outcome/session-manager-page';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/history/edit/$file/')({
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

    const { group, individual, evaluation, file } = params;

    if (!group || !individual || !evaluation || !file) {
      throw redirect({
        to: '/dashboard',
      });
    }

    return {
      cleanHandle: context.folderHandleContext.handle,
      group: CleanUpString(group),
      individual: CleanUpString(individual),
      evaluation: CleanUpString(evaluation),
      file: CleanUpString(file),
    };
  },
  loader: async ({ context }) => {
    const { group, individual, evaluation, file } = context;

    return {
      Group: group,
      Individual: individual,
      Evaluation: evaluation,
      FileString: file,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, FileString } = Route.useLoaderData();

  return <SessionManagerPage Group={Group} Individual={Individual} Evaluation={Evaluation} FileString={FileString} />;
}
