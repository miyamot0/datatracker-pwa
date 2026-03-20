import { createFileRoute, redirect } from '@tanstack/react-router';
import { CleanUpString } from '@/lib/strings';
import ClientsPage from '@/components/pages/dashboard-participants/clients-page';

export const Route = createFileRoute('/session/$group/')({
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

    const { group } = params;

    if (!group) {
      throw redirect({
        href: '/dashboard',
      });
    }

    return {
      Group: CleanUpString(group),
    };
  },
  loader: ({ params }) => {
    return {
      Group: params.group,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group } = Route.useLoaderData();

  return <ClientsPage Group={Group} />;
}
