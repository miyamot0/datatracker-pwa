import { act, render } from '@testing-library/react';
import { useContext } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FolderContextProvider, FolderHandleContext, FolderHandleContextType } from '../folder-context';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings/application-settings';
import { queryClient } from '@/App';

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

  it('applies functional setHandle updates against the latest handle', () => {
    const captured = renderProvider();
    const first = { name: 'first' } as unknown as FileSystemDirectoryHandle;
    const second = { name: 'second' } as unknown as FileSystemDirectoryHandle;

    act(() => {
      captured.value!.setHandle(first);
      captured.value!.setHandle((prev) => {
        expect(prev).toBe(first);
        return second;
      });
      expect(captured.value!.getHandle()).toBe(second);
    });
  });

  it('applies functional setIsInitialized updates against the latest flag', () => {
    const captured = renderProvider();

    act(() => {
      captured.value!.setIsInitialized(true);
      captured.value!.setIsInitialized((prev) => !prev);
      expect(captured.value!.getIsInitialized()).toBe(false);
    });
  });

  it('exposes the handle and settings values through state after updates', () => {
    const captured = renderProvider();
    const handle = {} as FileSystemDirectoryHandle;

    act(() => {
      captured.value!.setHandle(handle);
    });

    expect(captured.value!.handle).toBe(handle);
    expect(captured.value!.getHandle()).toBe(handle);
  });
});

describe('FolderContextProvider settings persistence', () => {
  const STORAGE_KEY = 'data_tracker_settings';

  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(queryClient, 'setDefaultOptions');
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('marks a first-time visitor as not returning when no settings are stored', () => {
    const captured = renderProvider();

    expect(captured.value!.getSettings()).toEqual({
      ...DEFAULT_APPLICATION_SETTINGS,
      IsReturningUser: false,
    });
    expect(queryClient.setDefaultOptions).not.toHaveBeenCalled();
  });

  it('keeps defaults when stored settings parse to a falsy value', () => {
    localStorage.setItem(STORAGE_KEY, 'null');

    const captured = renderProvider();

    expect(captured.value!.getSettings()).toEqual(DEFAULT_APPLICATION_SETTINGS);
    expect(queryClient.setDefaultOptions).not.toHaveBeenCalled();
  });

  it('merges stored settings over defaults on load', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ EnableFileDeletion: true }));

    const captured = renderProvider();

    expect(captured.value!.getSettings()).toEqual({
      ...DEFAULT_APPLICATION_SETTINGS,
      EnableFileDeletion: true,
    });
    expect(queryClient.setDefaultOptions).not.toHaveBeenCalled();
  });

  it('applies aggressive query caching on load when stored', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ CacheBehavior: 'aggressive' }));

    const captured = renderProvider();

    expect(captured.value!.getSettings().CacheBehavior).toBe('aggressive');
    expect(queryClient.setDefaultOptions).toHaveBeenCalledWith({
      queries: {
        staleTime: 1000 * 60 * 15,
        gcTime: 1000 * 60 * 30,
      },
    });
  });

  it('persists settings to localStorage and applies aggressive caching when saved', () => {
    const captured = renderProvider();
    const next = { ...DEFAULT_APPLICATION_SETTINGS, CacheBehavior: 'aggressive' as const };

    act(() => {
      captured.value!.saveSettings(next);
    });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(next);
    expect(queryClient.setDefaultOptions).toHaveBeenLastCalledWith({
      queries: {
        staleTime: 1000 * 60 * 15,
        gcTime: 1000 * 60 * 30,
      },
    });
  });

  it('applies default query caching when saved with normal cache behavior', () => {
    const captured = renderProvider();

    act(() => {
      captured.value!.saveSettings({ ...DEFAULT_APPLICATION_SETTINGS, CacheBehavior: 'normal' });
    });

    expect(queryClient.setDefaultOptions).toHaveBeenLastCalledWith({
      queries: {
        staleTime: 1000 * 60 * 1,
        gcTime: 1000 * 60 * 5,
      },
    });
  });
});
