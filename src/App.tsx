import { FolderContextProvider, RouterFolderHandleContext } from './context/folder-context';
import { ThemeProvider } from './components/ui/theme-provider';
import { routeTree } from './routeTree.gen';
import { RouterProvider, createHashHistory, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFolderHandleContext } from '@/hooks/use-folder-context';
import { useEffect, useRef, useState } from 'react';
import { setupQueryDevTools } from './lib/dev';

// Router-facing folder state is read-only: loaders and guards read values, components update through the hook
export interface CustomizedRouterContext {
  queryClient: QueryClient;
  folderHandleContext: RouterFolderHandleContext;
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
  const { settings, isInitialized } = folderHandleContext;
  const lastSettingsRef = useRef(settings);

  // Loader data copies settings at load time, so re-run loaders whenever settings change after startup
  useEffect(() => {
    if (!isInitialized || lastSettingsRef.current === settings) {
      return;
    }

    lastSettingsRef.current = settings;
    void router.invalidate();
  }, [settings, isInitialized]);

  // Built once from stable callbacks, so every field reads the latest provider state when a loader runs.
  // Spreading the provider value here would copy settings and isInitialized as of this render and go stale.
  const [routerContext] = useState<CustomizedRouterContext>(() => ({
    queryClient,
    folderHandleContext: {
      get handle() {
        return folderHandleContext.getHandle();
      },
      get settings() {
        return folderHandleContext.getSettings();
      },
      get isInitialized() {
        return folderHandleContext.getIsInitialized();
      },
      getHandle: folderHandleContext.getHandle,
      getSettings: folderHandleContext.getSettings,
      getIsInitialized: folderHandleContext.getIsInitialized,
    },
  }));

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
