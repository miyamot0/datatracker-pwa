import { CustomizedRouterContext } from '@/App';
import { redirect } from '@tanstack/react-router';

/**
 * Route guard to ensure that a folder handle is present in the context before allowing access to certain routes. If the folder handle is null, it redirects the user to the dashboard page.
 */
export function routeGuard({ context }: { context: CustomizedRouterContext }) {
  if (!context.folderHandleContext.handle) {
    throw redirect({
      href: '/dashboard',
    });
  }
}
