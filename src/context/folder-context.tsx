import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ApplicationSettingsTypes, DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';
import { createContext, Dispatch, ReactNode, SetStateAction, useEffect, useState } from 'react';

export type FolderHandleContextType = {
  handle: FileSystemDirectoryHandle | undefined;
  setHandle: Dispatch<SetStateAction<FileSystemDirectoryHandle | undefined>>;
  settings: ApplicationSettingsTypes;
  setSettings: Dispatch<SetStateAction<ApplicationSettingsTypes>>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  saveSettings: (_: ApplicationSettingsTypes) => {};
};

// Context for folder handle
export const FolderHandleContext = createContext({
  handle: undefined as FileSystemDirectoryHandle | undefined,
  setHandle: undefined as unknown as Dispatch<SetStateAction<FileSystemDirectoryHandle | undefined>>,
  settings: DEFAULT_APPLICATION_SETTINGS,
  setSettings: undefined as unknown as Dispatch<SetStateAction<ApplicationSettingsTypes>>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  saveSettings: (_: ApplicationSettingsTypes) => {},
});

/**
 * Folder context provider
 *
 * @param children
 * @returns
 */
export function FolderContextProvider({ children }: { children: ReactNode }) {
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | undefined>();
  const [settings, setSettings] = useState<ApplicationSettingsTypes>(DEFAULT_APPLICATION_SETTINGS);
  const saveSettings = (settings: ApplicationSettingsTypes) => {
    localStorage.setItem('data_tracker_settings', JSON.stringify(settings));
  };

  useEffect(() => {
    const settings = localStorage.getItem('data_tracker_settings');

    if (settings) {
      // At least *something* exists
      const parsedSettings = JSON.parse(settings);

      if (parsedSettings) {
        setSettings({
          ...DEFAULT_APPLICATION_SETTINGS,
          ...parsedSettings,
        });
      }
    } else {
      setSettings({
        ...DEFAULT_APPLICATION_SETTINGS,
        IsReturningUser: false,
      });
    }
  }, []);

  return (
    <TooltipProvider>
      <FolderHandleContext.Provider
        value={{
          handle,
          setHandle,
          settings,
          setSettings,
          saveSettings,
        }}
      >
        {children}
        <Toaster richColors expand={false} duration={3000} />
      </FolderHandleContext.Provider>
    </TooltipProvider>
  );
}
