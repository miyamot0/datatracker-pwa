import { routeGuard } from '../routing';
import { FolderHandleContextType } from '@/context/folder-context';
import { CustomizedRouterContext } from '@/App';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { redirect } from '@tanstack/react-router';

// Mock the redirect function
vi.mock('@tanstack/react-router', () => ({
  redirect: vi.fn((options) => {
    const error = new Error('Redirect');
    (error as any).redirect = options;
    return error;
  }),
}));

describe('Routing', () => {
  const createMockContext = (
    isInitialized: boolean,
    handle: FileSystemDirectoryHandle | null,
  ): CustomizedRouterContext => {
    const mockFolderHandleContext = {
      handle,
      setHandle: vi.fn(),
      settings: {},
      setSettings: vi.fn(),
      saveSettings: vi.fn(),
      isInitialized,
      setIsInitialized: vi.fn(),
    } as unknown as FolderHandleContextType;

    return {
      queryClient: {},
      folderHandleContext: mockFolderHandleContext,
    } as unknown as CustomizedRouterContext;
  };

  const createMockHandle = (): FileSystemDirectoryHandle =>
    ({
      kind: 'directory',
      name: 'test-directory',
    }) as FileSystemDirectoryHandle;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when not initialized', () => {
    it('should throw redirect to root when isInitialized is false', () => {
      const mockContext = createMockContext(false, null);

      try {
        routeGuard({ context: mockContext });
        expect.fail('Expected routeGuard to throw');
      } catch (error: any) {
        expect(error.message).toBe('Redirect');
        expect(error.redirect).toEqual({ href: '/' });
      }
    });

    it('should throw redirect to root when isInitialized is false even with valid handle', () => {
      const mockHandle = createMockHandle();
      const mockContext = createMockContext(false, mockHandle);

      try {
        routeGuard({ context: mockContext });
        expect.fail('Expected routeGuard to throw');
      } catch (error: any) {
        expect(error.message).toBe('Redirect');
        expect(error.redirect).toEqual({ href: '/' });
      }
    });
  });

  describe('when initialized', () => {
    it('should throw redirect to dashboard when handle is null', () => {
      const mockContext = createMockContext(true, null);

      try {
        routeGuard({ context: mockContext });
        expect.fail('Expected routeGuard to throw');
      } catch (error: any) {
        expect(error.message).toBe('Redirect');
        expect(error.redirect).toEqual({ to: '/dashboard' });
      }
    });

    it('should throw redirect to dashboard when handle is undefined', () => {
      const mockContext = createMockContext(true, undefined as any);

      try {
        routeGuard({ context: mockContext });
        expect.fail('Expected routeGuard to throw');
      } catch (error: any) {
        expect(error.message).toBe('Redirect');
        expect(error.redirect).toEqual({ to: '/dashboard' });
      }
    });

    it('should not throw when handle is present and valid', () => {
      const mockHandle = createMockHandle();
      const mockContext = createMockContext(true, mockHandle);

      expect(() => routeGuard({ context: mockContext })).not.toThrow();
    });

    it('should not call redirect when both conditions are satisfied', () => {
      const mockHandle = createMockHandle();
      const mockContext = createMockContext(true, mockHandle);

      routeGuard({ context: mockContext });

      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe('redirect function calls', () => {
    it('should call redirect with correct href for uninitialized context', () => {
      const mockContext = createMockContext(false, null);

      try {
        routeGuard({ context: mockContext });
      } catch (error) {
        // Expected to throw
      }

      expect(redirect).toHaveBeenCalledWith({ href: '/' });
      expect(redirect).toHaveBeenCalledTimes(1);
    });

    it('should call redirect with correct href for null handle', () => {
      const mockContext = createMockContext(true, null);

      try {
        routeGuard({ context: mockContext });
      } catch (error) {
        // Expected to throw
      }

      expect(redirect).toHaveBeenCalledWith({ to: '/dashboard' });
      expect(redirect).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle context with missing folderHandleContext', () => {
      const mockContext = {
        queryClient: {},
        folderHandleContext: null,
      } as unknown as CustomizedRouterContext;

      expect(() => routeGuard({ context: mockContext })).toThrow();
    });

    it('should handle context with partial folderHandleContext', () => {
      const mockContext = {
        queryClient: {},
        folderHandleContext: {
          isInitialized: true,
          // Missing handle property
        },
      } as unknown as CustomizedRouterContext;

      try {
        routeGuard({ context: mockContext });
        expect.fail('Expected routeGuard to throw');
      } catch (error: any) {
        expect(error.message).toBe('Redirect');
        expect(error.redirect).toEqual({ to: '/dashboard' });
      }
    });

    it('should prioritize isInitialized check over handle check', () => {
      // When isInitialized is false, it should redirect to root even if handle is present
      const mockHandle = createMockHandle();
      const mockContext = createMockContext(false, mockHandle);

      try {
        routeGuard({ context: mockContext });
        expect.fail('Expected routeGuard to throw');
      } catch (error: any) {
        expect(error.redirect).toEqual({ href: '/' });
      }

      // Should only call redirect once (for isInitialized check, not handle check)
      expect(redirect).toHaveBeenCalledTimes(1);
      expect(redirect).toHaveBeenCalledWith({ href: '/' });
    });

    it('should handle FileSystemDirectoryHandle with various properties', () => {
      const mockHandle = {
        kind: 'directory' as const,
        name: 'complex-directory-name-with-special-chars_123',
        // Add other typical FileSystemDirectoryHandle properties
        entries: vi.fn(),
        getDirectoryHandle: vi.fn(),
        getFileHandle: vi.fn(),
        keys: vi.fn(),
        values: vi.fn(),
        removeEntry: vi.fn(),
        resolve: vi.fn(),
      } as unknown as FileSystemDirectoryHandle;

      const mockContext = createMockContext(true, mockHandle);

      expect(() => routeGuard({ context: mockContext })).not.toThrow();
    });
  });
});
