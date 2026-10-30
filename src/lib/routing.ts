import { CustomizedRouterContext } from '@/App';
import { redirect } from '@tanstack/react-router';

/**
 * Route guard to ensure that a folder handle is present in the context before allowing access to certain routes. If the folder handle is null, it redirects the user to the dashboard page.
 *
 * Returns the narrowed handle and settings so callers do not need to re-read the (nullable) context.
 */
export function routeGuard({ context }: { context: CustomizedRouterContext }) {
  if (!context.folderHandleContext.isInitialized) {
    throw redirect({
      href: '/',
    });
  }

  const { handle, settings } = context.folderHandleContext;

  if (!handle) {
    throw redirect({
      to: '/dashboard',
    });
  }

  return { handle, settings };
}
