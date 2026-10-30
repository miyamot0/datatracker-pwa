import { act, render } from '@testing-library/react';
import { useContext } from 'react';
import { describe, it, expect } from 'vitest';
import { FolderContextProvider, FolderHandleContext, FolderHandleContextType } from '../folder-context';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings/application-settings';

function renderProvider() {
  const captured: { value?: FolderHandleContextType } = {};

  function Consumer() {
    captured.value = useContext(FolderHandleContext) as FolderHandleContextType;
    return null;
  }

  render(
    <FolderContextProvider>
      <Consumer />
    </FolderContextProvider>,
  );

  return captured;
}

describe('FolderContextProvider live getters', () => {
  it('returns the latest handle synchronously after setHandle', () => {
    const captured = renderProvider();
    const fakeHandle = {} as FileSystemDirectoryHandle;

    act(() => {
      captured.value!.setHandle(fakeHandle);
      expect(captured.value!.getHandle()).toBe(fakeHandle);
    });
  });

  it('returns the latest settings synchronously after setSettings', () => {
    const captured = renderProvider();
    const next = { ...DEFAULT_APPLICATION_SETTINGS, EnableFileDeletion: true };

    act(() => {
      captured.value!.setSettings(next);
      expect(captured.value!.getSettings().EnableFileDeletion).toBe(true);
    });
  });

  it('applies functional setSettings updates against the latest settings', () => {
    const captured = renderProvider();

    act(() => {
      captured.value!.setSettings((prev) => ({ ...prev, EnableFileDeletion: true }));
      captured.value!.setSettings((prev) => ({ ...prev, DisplaySize: 'wide' }));
      expect(captured.value!.getSettings().EnableFileDeletion).toBe(true);
      expect(captured.value!.getSettings().DisplaySize).toBe('wide');
    });
  });

  it('returns the latest isInitialized flag synchronously after setIsInitialized', () => {
    const captured = renderProvider();

    act(() => {
      captured.value!.setIsInitialized(true);
      expect(captured.value!.getIsInitialized()).toBe(true);
    });
  });
});
