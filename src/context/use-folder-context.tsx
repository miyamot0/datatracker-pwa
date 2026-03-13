import { useContext } from 'react';
import { FolderHandleContext } from './folder-context';

export function useFolderHandleContext() {
  const context = useContext(FolderHandleContext);

  if (context === undefined) {
    throw new Error('useFolderHandleContext must be used within a FolderContextProvider');
  }

  return context;
}
