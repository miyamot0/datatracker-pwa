import { routeGuard } from '../routing';
import { FolderHandleContextType } from '@/context/folder-context';
import { CustomizedRouterContext } from '@/App';
import { vi } from 'vitest';

describe('Routing', () => {
  it('should throw if folder handle is null', () => {
    const mockFolderHandleContext = {
      handle: null,
      setHandle: vi.fn(),
      settings: {},
      setSettings: vi.fn(),
      saveSettings: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    } as unknown as FolderHandleContextType;

    const mockContext = {
      routerHandle: {},
      queryClient: {},
      folderHandleContext: mockFolderHandleContext,
    } as unknown as CustomizedRouterContext;

    expect(() => routeGuard({ context: mockContext })).toThrow();
  });

  it('should not throw when handle is present', () => {
    // Create a proper mock for FileSystemDirectoryHandle
    const mockHandle = {
      kind: 'directory',
      name: 'test-directory',
    } as FileSystemDirectoryHandle;

    const mockFolderHandleContext = {
      handle: mockHandle,
      setHandle: vi.fn(),
      settings: {},
      setSettings: vi.fn(),
      saveSettings: vi.fn(),
      isInitialized: true,
      setIsInitialized: vi.fn(),
    } as unknown as FolderHandleContextType;

    const mockContext = {
      routerHandle: {},
      queryClient: {},
      folderHandleContext: mockFolderHandleContext,
    } as unknown as CustomizedRouterContext;

    expect(() => routeGuard({ context: mockContext })).not.toThrow();
  });
});
