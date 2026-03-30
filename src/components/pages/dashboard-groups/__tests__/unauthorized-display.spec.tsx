import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDisplayNotification = vi.hoisted(() => vi.fn());
const mockSetHandle = vi.hoisted(() => vi.fn());
const mockRouterInvalidate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockShowDirectoryPicker = vi.hoisted(() => vi.fn());

vi.mock('@/lib/notifications', () => ({
  displayConditionalNotification: mockDisplayNotification,
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <div>Back</div>,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useRouter: () => ({ invalidate: mockRouterInvalidate }),
    useRouterState: () => ({ matches: [{ routeId: '/unauthorized' }] }),
  };
});

import UnauthorizedDisplay from '../unauthorized-display';
import { FolderHandleContext } from '@/context/folder-context';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';

const renderPage = (enforce = false) =>
  render(
    <FolderHandleContext.Provider
      value={{
        handle: undefined,
        setHandle: mockSetHandle,
        settings: { ...DEFAULT_APPLICATION_SETTINGS, EnforceDataFolderName: enforce },
        setSettings: vi.fn(),
        saveSettings: vi.fn(),
        isInitialized: true,
        setIsInitialized: vi.fn(),
      }}
    >
      <UnauthorizedDisplay />
    </FolderHandleContext.Provider>,
  );

describe('UnauthorizedDisplay', () => {
  beforeEach(() => {
    mockDisplayNotification.mockReset();
    mockSetHandle.mockReset();
    mockRouterInvalidate.mockReset();
    mockRouterInvalidate.mockResolvedValue(undefined);
    mockRouterInvalidate.mockImplementation(async (options?: { filter?: (match: { routeId: string }) => boolean }) => {
      options?.filter?.({ routeId: '/unauthorized' });
      options?.filter?.({ routeId: '/other' });
    });
    mockShowDirectoryPicker.mockReset();

    vi.stubGlobal('showDirectoryPicker', mockShowDirectoryPicker);
  });

  it('renders authorization instructions and button', async () => {
    await renderPage(false);

    await expect.element(page.getByText('Program Access and Authorization')).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Authorize Access' })).toBeInTheDocument();
  });

  it('authorizes valid directory, sets handle, and invalidates route', async () => {
    mockShowDirectoryPicker.mockResolvedValue({ name: 'DataTracker' });
    await renderPage(false);

    await page.getByRole('button', { name: 'Authorize Access' }).click();

    await vi.waitFor(() => {
      expect(mockSetHandle).toHaveBeenCalled();
      expect(mockDisplayNotification).toHaveBeenCalledWith(
        expect.anything(),
        'Access Authorized',
        'You can now interact with files in the relevant folder.',
      );
      expect(mockRouterInvalidate).toHaveBeenCalledWith(expect.objectContaining({ sync: true, forcePending: true }));
    });
  });

  it('shows error notification when folder name is invalid under enforcement', async () => {
    mockShowDirectoryPicker.mockResolvedValue({ name: 'WrongFolder' });
    await renderPage(true);

    await page.getByRole('button', { name: 'Authorize Access' }).click();

    expect(mockDisplayNotification).toHaveBeenCalledWith(
      expect.anything(),
      'Error Authorizing Directory',
      "Please select a folder named 'DataTracker' to continue.",
      3000,
      true,
    );
    expect(mockSetHandle).not.toHaveBeenCalled();
    expect(mockRouterInvalidate).not.toHaveBeenCalled();
  });

  it('does nothing when picker returns undefined', async () => {
    mockShowDirectoryPicker.mockResolvedValue(undefined);
    await renderPage(false);

    await page.getByRole('button', { name: 'Authorize Access' }).click();

    expect(mockSetHandle).not.toHaveBeenCalled();
    expect(mockRouterInvalidate).not.toHaveBeenCalled();
  });

  it('handles Error instance from picker failure', async () => {
    mockShowDirectoryPicker.mockRejectedValue(new Error('Access denied'));
    await renderPage(false);

    await page.getByRole('button', { name: 'Authorize Access' }).click();

    expect(mockDisplayNotification).toHaveBeenCalledWith(
      expect.anything(),
      'Error Authorizing Directory',
      'Access denied',
      3000,
      true,
    );
  });

  it('handles unknown thrown values from picker failure', async () => {
    mockShowDirectoryPicker.mockRejectedValue('Unknown failure');
    await renderPage(false);

    await page.getByRole('button', { name: 'Authorize Access' }).click();

    expect(mockDisplayNotification).toHaveBeenCalledWith(
      expect.anything(),
      'Error Authorizing Directory',
      'An unknown error occurred while trying to authorize the directory.',
      3000,
      true,
    );
  });
});
