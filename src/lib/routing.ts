import { CustomizedRouterContext } from '@/App';
import { redirect } from '@tanstack/react-router';

export function routeGuard({ context }: { context: CustomizedRouterContext }) {
  if (!context.folderHandleContext.handle) {
    throw redirect({
      href: '/dashboard',
    });
  }
}
