import { renderHook } from '@testing-library/react';
import { createElement, useContext, type ContextType, type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FolderHandleContext } from '@/context/folder-context';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings/application-settings';
import { useFolderHandleContext } from '../use-folder-context';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useContext: vi.fn(actual.useContext) };
});

describe('useFolderHandleContext', () => {
  beforeEach(() => {
    vi.mocked(useContext).mockClear();
  });

  it('returns the value supplied by the nearest FolderHandleContext provider', () => {
    const value = {
      handle: undefined,
      getHandle: () => undefined,
      setHandle: () => {},
      settings: DEFAULT_APPLICATION_SETTINGS,
      getSettings: () => DEFAULT_APPLICATION_SETTINGS,
      setSettings: () => {},
      saveSettings: () => {},
      isInitialized: true,
      getIsInitialized: () => true,
      setIsInitialized: () => {},
    } as unknown as ContextType<typeof FolderHandleContext>;

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(FolderHandleContext.Provider, { value }, children);

    const { result } = renderHook(() => useFolderHandleContext(), { wrapper });

    expect(result.current).toBe(value);
  });

  it('returns the default context value when no provider is present', () => {
    const { result } = renderHook(() => useFolderHandleContext());

    expect(result.current.handle).toBeUndefined();
    expect(result.current.getHandle()).toBeUndefined();
    expect(result.current.settings).toEqual(DEFAULT_APPLICATION_SETTINGS);
    expect(result.current.getSettings()).toEqual(DEFAULT_APPLICATION_SETTINGS);
    expect(result.current.getIsInitialized()).toBeUndefined();
    expect(() => result.current.saveSettings(DEFAULT_APPLICATION_SETTINGS)).not.toThrow();
  });

  it('throws when the context lookup yields undefined', async () => {
    const actual = await vi.importActual<typeof import('react')>('react');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(useContext).mockImplementation(() => undefined as never);

    try {
      expect(() => renderHook(() => useFolderHandleContext())).toThrow(
        'useFolderHandleContext must be used within a FolderContextProvider',
      );
    } finally {
      vi.mocked(useContext).mockImplementation(actual.useContext);
      consoleError.mockRestore();
    }
  });
});
