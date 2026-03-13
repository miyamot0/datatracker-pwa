import { CustomizedRouterContext } from '@/App';
import { redirect } from '@tanstack/react-router';

export function routeGuard({ context }: { context: CustomizedRouterContext }) {
  if (!context.folderHandleContext.handle) {
    // TODO: remove this later
    console.log('No folder handle found, redirecting to home page');

    throw redirect({
      href: '/dashboard',
    });
  }
}
