import { FolderContextProvider, FolderHandleContextType } from './context/folder-context';
import { ThemeProvider } from './components/ui/theme-provider';
import { routeTree } from './routeTree.gen';
import { RouterProvider, createHashHistory, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFolderHandleContext } from '@/hooks/use-folder-context';
import { useMemo } from 'react';
import { setupQueryDevTools } from './lib/dev';

export interface CustomizedRouterContext {
  queryClient: QueryClient;
  folderHandleContext: FolderHandleContextType;
}

// Create a hash history for the router
const hashHistory = createHashHistory();

// Create the router with the defined route tree and history
const router = createRouter({
  routeTree,
  history: hashHistory,
  defaultViewTransition: false,
  context: {
    queryClient: undefined!,
    folderHandleContext: undefined!,
  },
});

// Extend the router context type to include our customized context
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Initialize the query client for React Query
export const queryClient = new QueryClient();

// Attach logging if in dev mode
if (import.meta.env.DEV) {
  setupQueryDevTools(queryClient);
}

/**
 * InnerApp component that sets up the RouterProvider with the customized context. This component retrieves the folder handle context using the `useFolderHandleContext` hook and passes it along with the query client to the RouterProvider. The RouterProvider is responsible for rendering the appropriate components based on the defined routes and managing navigation within the application. By providing the customized context, we ensure that all components rendered by the router have access to both the query client and the folder handle context, allowing for seamless integration of data fetching and folder management functionalities throughout the application.
 *
 * @returns - The RouterProvider component wrapped with the necessary context for routing and state management in the application.
 */
const InnerApp = () => {
  const folderHandleContext = useFolderHandleContext();

  const routerContext = useMemo(
    () => ({
      queryClient,
      folderHandleContext,
    }),
    [folderHandleContext],
  );

  return <RouterProvider router={router} context={routerContext} />;
};

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <FolderContextProvider>
        <QueryClientProvider client={queryClient}>
          <InnerApp />
        </QueryClientProvider>
      </FolderContextProvider>
    </ThemeProvider>
  );
}

export default App;
