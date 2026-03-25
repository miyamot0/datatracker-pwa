import { useContext } from 'react';
import { FolderHandleContext } from '@/context/folder-context';

/**
 * Custom hook to access the FolderHandleContext. This hook ensures that the context is used within a valid provider and provides type safety for the context value. It retrieves the current folder handle context, which includes the folder handle, settings, and related functions for managing the folder state. If the hook is used outside of a FolderContextProvider, it throws an error to prevent unintended usage and ensure that components have access to the necessary context for folder management functionalities.
 *
 * @returns - The current value of the FolderHandleContext, which includes the folder handle, settings, and related functions for managing the folder state.
 */
export function useFolderHandleContext() {
  const context = useContext(FolderHandleContext);

  if (context === undefined) {
    throw new Error('useFolderHandleContext must be used within a FolderContextProvider');
  }

  return context;
}
