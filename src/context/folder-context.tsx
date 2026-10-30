import { queryClient } from '@/App';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ApplicationSettingsTypes, DEFAULT_APPLICATION_SETTINGS } from '@/types/settings/application-settings';
import { createContext, Dispatch, ReactNode, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

export interface FolderHandleContextType {
  handle: FileSystemDirectoryHandle | undefined;
  getHandle: () => FileSystemDirectoryHandle | undefined;
  setHandle: Dispatch<SetStateAction<FileSystemDirectoryHandle | undefined>>;
  settings: ApplicationSettingsTypes;
  getSettings: () => ApplicationSettingsTypes;
  setSettings: Dispatch<SetStateAction<ApplicationSettingsTypes>>;
  saveSettings: (_settings: ApplicationSettingsTypes) => void;
  isInitialized: boolean;
  getIsInitialized: () => boolean;
  setIsInitialized: Dispatch<SetStateAction<boolean>>;
}

// Router-facing folder state is read-only: loaders and guards read values, components update through the hook
export type RouterFolderHandleContext = Pick<
  FolderHandleContextType,
  'handle' | 'settings' | 'isInitialized' | 'getHandle' | 'getSettings' | 'getIsInitialized'
>;

// Context for folder handle
export const FolderHandleContext = createContext({
  handle: undefined as FileSystemDirectoryHandle | undefined,
  getHandle: () => undefined as FileSystemDirectoryHandle | undefined,
  setHandle: undefined as unknown as Dispatch<SetStateAction<FileSystemDirectoryHandle | undefined>>,
  settings: DEFAULT_APPLICATION_SETTINGS,
  getSettings: () => DEFAULT_APPLICATION_SETTINGS as ApplicationSettingsTypes,
  setSettings: undefined as unknown as Dispatch<SetStateAction<ApplicationSettingsTypes>>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  saveSettings: (_: ApplicationSettingsTypes) => {},
  isInitialized: undefined as unknown as boolean,
  getIsInitialized: () => undefined as unknown as boolean,
  setIsInitialized: undefined as unknown as Dispatch<SetStateAction<boolean>>,
});

/**
 * Folder context provider
 *
 * @param children React children components that will have access to the folder context
 * @returns A context provider component that wraps its children with the FolderHandleContext, providing access to the folder handle, settings, and related functions. It also includes a Toaster for displaying notifications and a TooltipProvider for tooltips.
 */
export function FolderContextProvider({ children }: { children: ReactNode }) {
  const [handle, setHandleState] = useState<FileSystemDirectoryHandle | undefined>();
  const handleRef = useRef<FileSystemDirectoryHandle | undefined>(undefined);

  // Updates the ref synchronously so route loaders invalidated right after this call read the new handle
  const setHandle = useCallback<Dispatch<SetStateAction<FileSystemDirectoryHandle | undefined>>>((action) => {
    const next = typeof action === 'function' ? action(handleRef.current) : action;
    handleRef.current = next;
    setHandleState(next);
  }, []);

  const getHandle = useCallback(() => handleRef.current, []);

  const [settings, setSettingsState] = useState<ApplicationSettingsTypes>(DEFAULT_APPLICATION_SETTINGS);
  const settingsRef = useRef<ApplicationSettingsTypes>(DEFAULT_APPLICATION_SETTINGS);

  // Mirrors setHandle so loaders invalidated right after a settings change read the new value
  const setSettings = useCallback<Dispatch<SetStateAction<ApplicationSettingsTypes>>>((action) => {
    const next = typeof action === 'function' ? action(settingsRef.current) : action;
    settingsRef.current = next;
    setSettingsState(next);
  }, []);

  const getSettings = useCallback(() => settingsRef.current, []);

  const [isInitialized, setIsInitializedState] = useState(false);
  const isInitializedRef = useRef(false);

  const setIsInitialized = useCallback<Dispatch<SetStateAction<boolean>>>((action) => {
    const next = typeof action === 'function' ? action(isInitializedRef.current) : action;
    isInitializedRef.current = next;
    setIsInitializedState(next);
  }, []);

  const getIsInitialized = useCallback(() => isInitializedRef.current, []);

  const staleTimeAggressive = 1000 * 60 * 15; // 15 minutes
  const gcTimeAggressive = 1000 * 60 * 30; // 30 minutes

  const staleTimeDefault = 1000 * 60 * 1; // 1 minute
  const gcTimeDefault = 1000 * 60 * 5; // 5 minutes

  /**
   * Save application settings
   *
   * @param _settings The application settings to be saved. This function saves the provided settings to local storage and updates the query client's default options based on the cache behavior specified in the settings. If the cache behavior is set to 'aggressive', it sets longer stale time and garbage collection time for queries; otherwise, it sets them to default values. It also includes commented-out code for setting view transition behavior based on the settings, which can be implemented as needed.
   */
  const saveSettings = useCallback((_settings: ApplicationSettingsTypes) => {
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
  }, []);

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
          getHandle,
          setHandle,
          settings,
          getSettings,
          setSettings,
          saveSettings,
          isInitialized,
          getIsInitialized,
          setIsInitialized,
        }}
      >
        {children}
        <Toaster richColors expand={false} duration={3000} />
      </FolderHandleContext.Provider>
    </TooltipProvider>
  );
}
