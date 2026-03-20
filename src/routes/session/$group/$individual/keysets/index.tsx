import { createFileRoute, redirect } from '@tanstack/react-router';
import { CleanUpString } from '@/lib/strings';
import KeySetsPage from '@/components/pages/dashboard-keysets/keysets-page';

export const Route = createFileRoute('/session/$group/$individual/keysets/')({
  beforeLoad: ({ context, params }) => {
    if (!context.folderHandleContext.isInitialized) {
      throw redirect({
        href: '/',
      });
    }

    if (!context.folderHandleContext.handle) {
      throw redirect({
        href: '/dashboard',
      });
    }

    const { group, individual } = params;

    if (!group || !individual) {
      throw redirect({
        href: '/dashboard',
      });
    }
  },
  loader: ({ params }) => {
    const { group, individual } = params;

    return {
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual } = Route.useLoaderData();

  return <KeySetsPage Group={Group} Individual={Individual} />;
}
