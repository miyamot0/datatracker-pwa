import KeySetEditor from '@/components/pages/editor-keyset/keyset-editor';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/session/$group/$individual/keysets/$keyset/')({
  beforeLoad: ({ params, context }) => {
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

    const { group, individual, keyset } = params;

    if (!group || !individual || !keyset) {
      throw redirect({
        href: '/dashboard',
      });
    }

    return {
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
      KeySet: CleanUpString(keyset),
    };
  },
  loader: ({ context }) => {
    const { Group, Individual, KeySet } = context;

    return {
      Group: Group,
      Individual: Individual,
      KeySet: KeySet,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, KeySet } = Route.useLoaderData();

  return <KeySetEditor Group={Group} Individual={Individual} KeySet={KeySet} />;
}
