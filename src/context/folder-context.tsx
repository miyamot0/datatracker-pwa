import { queryClient } from '@/App';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ApplicationSettingsTypes, DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';
import { createContext, Dispatch, ReactNode, SetStateAction, useEffect, useState } from 'react';

export interface FolderHandleContextType {
  handle: FileSystemDirectoryHandle | undefined;
  setHandle: Dispatch<SetStateAction<FileSystemDirectoryHandle | undefined>>;
  settings: ApplicationSettingsTypes;
  setSettings: Dispatch<SetStateAction<ApplicationSettingsTypes>>;
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  saveSettings: (_settings: ApplicationSettingsTypes) => void;
  isInitialized: boolean;
  setIsInitialized: Dispatch<SetStateAction<boolean>>;
}

// Context for folder handle
export const FolderHandleContext = createContext({
  handle: undefined as FileSystemDirectoryHandle | undefined,
  setHandle: undefined as unknown as Dispatch<SetStateAction<FileSystemDirectoryHandle | undefined>>,
  settings: DEFAULT_APPLICATION_SETTINGS,
  setSettings: undefined as unknown as Dispatch<SetStateAction<ApplicationSettingsTypes>>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  saveSettings: (_: ApplicationSettingsTypes) => {},
  isInitialized: undefined as unknown as boolean,
  setIsInitialized: undefined as unknown as Dispatch<SetStateAction<boolean>>,
});

/**
 * Folder context provider
 *
 * @param children
 * @returns
 */
export function FolderContextProvider({ children }: { children: ReactNode }) {
  //const router = useRouter();
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | undefined>();
  const [settings, setSettings] = useState<ApplicationSettingsTypes>(DEFAULT_APPLICATION_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);

  const staleTimeAggressive = 1000 * 60 * 15; // 15 minutes
  const gcTimeAggressive = 1000 * 60 * 30; // 30 minutes

  const staleTimeDefault = 0; // 0 minutes
  const gcTimeDefault = 1000 * 60 * 5; // 5 minutes

  const saveSettings = (_settings: ApplicationSettingsTypes) => {
    localStorage.setItem('data_tracker_settings', JSON.stringify(_settings));

    if (_settings.CacheBehavior === 'aggressive') {
      queryClient.setDefaultOptions({
        queries: {
          staleTime: staleTimeAggressive,
          gcTime: gcTimeAggressive,
        },
      });
    } else {
      queryClient.setDefaultOptions({
        queries: {
          staleTime: staleTimeDefault,
          gcTime: gcTimeDefault,
        },
      });
    }

    /*
    if (router?.options) {
      router.options.defaultViewTransition = viewTransitionCall(_settings.TransitionBehavior);
    }
    */
  };

  useEffect(() => {
    const settings = localStorage.getItem('data_tracker_settings');

    if (settings) {
      // At least *something* exists
      const parsedSettings = JSON.parse(settings);

      if (parsedSettings) {
        const remappedSettings = {
          ...DEFAULT_APPLICATION_SETTINGS,
          ...parsedSettings,
        } satisfies ApplicationSettingsTypes;

        setSettings(remappedSettings);

        // Note: otherwise, remain at defaults
        if (remappedSettings.CacheBehavior === 'aggressive') {
          queryClient.setDefaultOptions({
            queries: {
              staleTime: staleTimeAggressive,
              gcTime: gcTimeAggressive,
            },
          });
        }
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
          isInitialized,
          setIsInitialized,
        }}
      >
        {children}
        <Toaster richColors expand={false} duration={3000} />
      </FolderHandleContext.Provider>
    </TooltipProvider>
  );
}
