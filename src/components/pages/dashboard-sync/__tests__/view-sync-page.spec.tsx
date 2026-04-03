import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNotification = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());
const mockShowDirectoryPicker = vi.hoisted(() => vi.fn());

vi.mock('@/lib/notifications', () => ({
  displayConditionalNotification: mockNotification,
}));

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
  },
}));

vi.mock('../views/sync-to-remote-table', () => ({
  default: () => <div data-testid="sync-to-table">Sync To Table</div>,
}));

vi.mock('../views/sync-from-remote-table', () => ({
  default: () => <div data-testid="sync-from-table">Sync From Table</div>,
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button>Back</button>,
}));

import ViewSyncPage from '../view-sync-page';

const makeSettings = (enforce = false) =>
  ({
    ...({} as any),
    EnforceDataFolderName: enforce,
  }) as any;

const renderView = (enforce = false) =>
  render(<ViewSyncPage Settings={makeSettings(enforce)} Handle={{} as FileSystemDirectoryHandle} />);

describe('ViewSyncPage', () => {
  beforeEach(() => {
    mockNotification.mockReset();
    mockToastError.mockReset();
    mockShowDirectoryPicker.mockReset();
    vi.stubGlobal('showDirectoryPicker', mockShowDirectoryPicker);
  });

  it('renders default state before selecting remote', async () => {
    await renderView();

    await expect.element(page.getByText('File Sync Assistant')).toBeInTheDocument();
    await expect.element(page.getByText('No Remote Selected')).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Select Remote Backup' })).toBeInTheDocument();
  });

  it('shows validation notification when enforced folder name is incorrect', async () => {
    mockShowDirectoryPicker.mockResolvedValue({ name: 'WrongFolder' });
    await renderView(true);

    await page.getByRole('button', { name: 'Select Remote Backup' }).click();

    expect(mockNotification).toHaveBeenCalledWith(
      expect.anything(),
      'Error Authorizing Remote Directory',
      "Please select a remote folder named 'DataTracker' to continue.",
      3000,
      true,
    );
    await expect.element(page.getByText('No Remote Selected')).toBeInTheDocument();
  });

  it('sets remote handle and shows to-remote table', async () => {
    mockShowDirectoryPicker.mockResolvedValue({ name: 'DataTracker' });
    await renderView(false);

    await page.getByRole('button', { name: 'Select Remote Backup' }).click();

    await expect.element(page.getByText('Remote Access Authorized')).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Syncing TO Remote' })).toBeInTheDocument();
    await expect.element(page.getByTestId('sync-to-table')).toBeInTheDocument();
    expect(mockNotification).toHaveBeenCalledWith(
      expect.anything(),
      'Access Authorized',
      'You can you interact with files in the relevant folder.',
    );
  });

  it('toggles sync direction after remote is selected', async () => {
    mockShowDirectoryPicker.mockResolvedValue({ name: 'DataTracker' });
    await renderView();

    await page.getByRole('button', { name: 'Select Remote Backup' }).click();
    await page.getByRole('button', { name: 'Syncing TO Remote' }).click();

    await expect.element(page.getByRole('button', { name: 'Syncing FROM Remote' })).toBeInTheDocument();
    await expect.element(page.getByTestId('sync-from-table')).toBeInTheDocument();

    await page.getByRole('button', { name: 'Syncing FROM Remote' }).click();
    await expect.element(page.getByRole('button', { name: 'Syncing TO Remote' })).toBeInTheDocument();
    await expect.element(page.getByTestId('sync-to-table')).toBeInTheDocument();
  });

  it('does not authorize remote when directory picker returns undefined', async () => {
    mockShowDirectoryPicker.mockResolvedValue(undefined);
    await renderView();

    await page.getByRole('button', { name: 'Select Remote Backup' }).click();

    await expect.element(page.getByText('No Remote Selected')).toBeInTheDocument();
    expect(mockNotification).not.toHaveBeenCalledWith(expect.anything(), 'Access Authorized', expect.anything());
  });

  it('shows toast error when directory picker throws', async () => {
    mockShowDirectoryPicker.mockRejectedValue(new Error('No access'));
    await renderView();

    await page.getByRole('button', { name: 'Select Remote Backup' }).click();

    expect(mockToastError).toHaveBeenCalledWith(
      'Directory access was not authorized. Please try again and authorize access to a folder to continue.',
    );
  });
});
