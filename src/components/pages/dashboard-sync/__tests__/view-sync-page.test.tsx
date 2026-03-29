import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ViewSyncPage from '../view-sync-page';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';

// ----- Module mocks -----

vi.mock('@/lib/notifications', () => ({
  displayConditionalNotification: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    promise: vi.fn(),
  },
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button>Back</button>,
}));

vi.mock('../views/sync-to-remote-table', () => ({
  default: () => <div data-testid="sync-to-remote-table">SyncToRemote</div>,
}));

vi.mock('../views/sync-from-remote-table', () => ({
  default: () => <div data-testid="sync-from-remote-table">SyncFromRemote</div>,
}));

// ----- Helpers -----

const makeHandle = (name: string) =>
  ({ name, getDirectoryHandle: vi.fn(), getFileHandle: vi.fn() }) as unknown as FileSystemDirectoryHandle;

const defaultProps = {
  Settings: { ...DEFAULT_APPLICATION_SETTINGS, EnforceDataFolderName: false },
  Handle: makeHandle('root'),
};

const enforceProps = {
  ...defaultProps,
  Settings: { ...DEFAULT_APPLICATION_SETTINGS, EnforceDataFolderName: true },
};

// ----- Tests -----

describe('ViewSyncPage', () => {
  let showDirectoryPickerMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    showDirectoryPickerMock = vi.fn().mockResolvedValue(makeHandle('DataTracker'));
    (window as unknown as Record<string, unknown>).showDirectoryPicker = showDirectoryPickerMock;
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).showDirectoryPicker;
    vi.restoreAllMocks();
  });

  // ---- Card layout ----

  describe('card layout', () => {
    it('renders the card title', () => {
      render(<ViewSyncPage {...defaultProps} />);
      expect(screen.getByText('File Sync Assistant')).not.toBeNull();
    });

    it('renders the card description', () => {
      render(<ViewSyncPage {...defaultProps} />);
      expect(screen.getByText('Sync Files as Necessary across Folders')).not.toBeNull();
    });

    it('renders the informational paragraph', () => {
      render(<ViewSyncPage {...defaultProps} />);
      expect(screen.getByText(/assists with managing a shared\/remote backup/i)).not.toBeNull();
    });

    it('renders the BackButton', () => {
      render(<ViewSyncPage {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Back' })).not.toBeNull();
    });
  });

  // ---- Initial state (no remote selected) ----

  describe('initial state — no remote selected', () => {
    it('shows the "No Remote Selected" badge', () => {
      render(<ViewSyncPage {...defaultProps} />);
      expect(screen.getByText('No Remote Selected')).not.toBeNull();
    });

    it('shows the "Select Remote Backup" button', () => {
      render(<ViewSyncPage {...defaultProps} />);
      expect(screen.getByRole('button', { name: /select remote backup/i })).not.toBeNull();
    });

    it('does not show the direction toggle button initially', () => {
      render(<ViewSyncPage {...defaultProps} />);
      expect(screen.queryByRole('button', { name: /syncing/i })).toBeNull();
    });

    it('does not render SyncToRemoteTable initially', () => {
      render(<ViewSyncPage {...defaultProps} />);
      expect(screen.queryByTestId('sync-to-remote-table')).toBeNull();
    });

    it('does not render SyncFromRemoteTable initially', () => {
      render(<ViewSyncPage {...defaultProps} />);
      expect(screen.queryByTestId('sync-from-remote-table')).toBeNull();
    });
  });

  // ---- After selecting remote ----

  describe('after selecting a remote directory', () => {
    it('shows the "Remote Access Authorized" badge after selecting', async () => {
      render(<ViewSyncPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /select remote backup/i }));
      await waitFor(() => {
        expect(screen.getByText('Remote Access Authorized')).not.toBeNull();
      });
    });

    it('shows the direction toggle button after selecting', async () => {
      render(<ViewSyncPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /select remote backup/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /syncing to remote/i })).not.toBeNull();
      });
    });

    it('shows SyncToRemoteTable by default (to_remote direction)', async () => {
      render(<ViewSyncPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /select remote backup/i }));
      await waitFor(() => {
        expect(screen.getByTestId('sync-to-remote-table')).not.toBeNull();
      });
    });

    it('does not show SyncFromRemoteTable by default', async () => {
      render(<ViewSyncPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /select remote backup/i }));
      await waitFor(() => {
        expect(screen.queryByTestId('sync-from-remote-table')).toBeNull();
      });
    });

    it('hides the "Select Remote Backup" button after selecting', async () => {
      render(<ViewSyncPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /select remote backup/i }));
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /select remote backup/i })).toBeNull();
      });
    });
  });

  // ---- Direction toggle ----

  describe('direction toggle', () => {
    it('toggles from to_remote to from_remote when direction button is clicked', async () => {
      render(<ViewSyncPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /select remote backup/i }));
      await waitFor(() => screen.getByRole('button', { name: /syncing to remote/i }));

      fireEvent.click(screen.getByRole('button', { name: /syncing to remote/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /syncing from remote/i })).not.toBeNull();
      });
    });

    it('shows SyncFromRemoteTable after toggling to from_remote', async () => {
      render(<ViewSyncPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /select remote backup/i }));
      await waitFor(() => screen.getByRole('button', { name: /syncing to remote/i }));

      fireEvent.click(screen.getByRole('button', { name: /syncing to remote/i }));
      await waitFor(() => {
        expect(screen.getByTestId('sync-from-remote-table')).not.toBeNull();
        expect(screen.queryByTestId('sync-to-remote-table')).toBeNull();
      });
    });

    it('toggles back to to_remote when clicked again', async () => {
      render(<ViewSyncPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /select remote backup/i }));
      await waitFor(() => screen.getByRole('button', { name: /syncing to remote/i }));

      fireEvent.click(screen.getByRole('button', { name: /syncing to remote/i }));
      await waitFor(() => screen.getByRole('button', { name: /syncing from remote/i }));

      fireEvent.click(screen.getByRole('button', { name: /syncing from remote/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /syncing to remote/i })).not.toBeNull();
      });
    });
  });

  // ---- EnforceDataFolderName ----

  describe('EnforceDataFolderName = true', () => {
    it('calls displayConditionalNotification and does not set remote when folder name is wrong', async () => {
      const { displayConditionalNotification } = await import('@/lib/notifications');
      showDirectoryPickerMock.mockResolvedValue(makeHandle('WrongName'));

      render(<ViewSyncPage {...enforceProps} />);
      fireEvent.click(screen.getByRole('button', { name: /select remote backup/i }));

      await waitFor(() => {
        expect(displayConditionalNotification).toHaveBeenCalledWith(
          expect.anything(),
          'Error Authorizing Remote Directory',
          expect.stringContaining('DataTracker'),
          expect.any(Number),
          true,
        );
      });
    });

    it('sets the remote handle when folder name is "DataTracker"', async () => {
      showDirectoryPickerMock.mockResolvedValue(makeHandle('DataTracker'));

      render(<ViewSyncPage {...enforceProps} />);
      fireEvent.click(screen.getByRole('button', { name: /select remote backup/i }));

      await waitFor(() => {
        expect(screen.getByText('Remote Access Authorized')).not.toBeNull();
      });
    });
  });

  // ---- Error handling ----

  describe('error handling', () => {
    it('shows a toast error when directory picker throws', async () => {
      const { toast } = await import('sonner');
      showDirectoryPickerMock.mockRejectedValue(new Error('User cancelled'));

      render(<ViewSyncPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /select remote backup/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('not authorized'));
      });
    });

    it('does not set remote handle when directory picker throws', async () => {
      showDirectoryPickerMock.mockRejectedValue(new Error('User cancelled'));

      render(<ViewSyncPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /select remote backup/i }));

      await waitFor(() => {
        expect(screen.queryByText('Remote Access Authorized')).toBeNull();
      });
    });
  });
});
