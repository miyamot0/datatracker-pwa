import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ----- Hoisted mocks -----

const mockListBothFiles = vi.hoisted(() => vi.fn().mockResolvedValue({ localFiles: [], remoteFiles: [] }));
const mockSyncFiles = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockToastError = vi.hoisted(() => vi.fn());
const mockToastPromise = vi.hoisted(() => vi.fn());

// ----- Module mocks -----

vi.mock('@/hooks/use-main-thread-sync', () => ({
  useMainThreadSync: () => ({
    listBothFiles: mockListBothFiles,
    syncFiles: mockSyncFiles,
  }),
}));

vi.mock('@/components/ui/data-table-reli', () => ({
  ReliabilityDataTable: ({ data, direction, optionalButtons, callback }: any) => (
    <div data-testid="reliability-table">
      <span data-testid="table-direction">{direction}</span>
      {data.map((row: any) => (
        <div key={row.id} data-testid="table-row">
          {row.file}
        </div>
      ))}
      <div data-testid="optional-buttons">{optionalButtons}</div>
      <button data-testid="sync-callback" onClick={() => callback([])}>
        Sync
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/data-table-column-header', () => ({
  DataTableColumnHeader: ({ title }: any) => <span>{title}</span>,
}));

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
    promise: mockToastPromise,
  },
}));

// ----- Import under test -----

import SyncFromRemoteTable from '../sync-from-remote-table';

// ----- Helpers -----

const makeHandle = (name = 'handle') => ({ name }) as FileSystemDirectoryHandle;

// ----- Tests -----

describe('SyncFromRemoteTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListBothFiles.mockResolvedValue({ localFiles: [], remoteFiles: [] });
  });

  it('shows loading indicator initially', () => {
    render(<SyncFromRemoteTable Handle={makeHandle('local')} RemoteHandle={makeHandle('remote')} />);
    expect(screen.getByText('Loading files...')).not.toBeNull();
  });

  it('hides loading indicator after files load', async () => {
    render(<SyncFromRemoteTable Handle={makeHandle('local')} RemoteHandle={makeHandle('remote')} />);
    await waitFor(() => {
      expect(screen.queryByText('Loading files...')).toBeNull();
    });
  });

  it('calls listBothFiles on mount with correct handles', async () => {
    const local = makeHandle('local');
    const remote = makeHandle('remote');
    render(<SyncFromRemoteTable Handle={local} RemoteHandle={remote} />);
    await waitFor(() => {
      expect(mockListBothFiles).toHaveBeenCalledWith(local, remote);
    });
  });

  it('renders the table with direction="Local"', async () => {
    render(<SyncFromRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await waitFor(() => {
      expect(screen.getByTestId('table-direction').textContent).toBe('Local');
    });
  });

  it('shows remote files that are not in local (unsynced)', async () => {
    mockListBothFiles.mockResolvedValue({
      localFiles: ['a.json'],
      remoteFiles: ['a.json', 'b.json'],
    });
    render(<SyncFromRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await waitFor(() => {
      expect(screen.getByText('b.json')).not.toBeNull();
    });
  });

  it('does not show remote files that are already in local (synced)', async () => {
    mockListBothFiles.mockResolvedValue({
      localFiles: ['a.json'],
      remoteFiles: ['a.json', 'b.json'],
    });
    render(<SyncFromRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await waitFor(() => {
      const rows = screen.queryAllByTestId('table-row');
      const texts = rows.map((r) => r.textContent);
      expect(texts).not.toContain('a.json');
    });
  });

  it('renders no rows when all remote files are already local', async () => {
    mockListBothFiles.mockResolvedValue({
      localFiles: ['a.json', 'b.json'],
      remoteFiles: ['a.json', 'b.json'],
    });
    render(<SyncFromRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await waitFor(() => {
      expect(screen.queryAllByTestId('table-row').length).toBe(0);
    });
  });

  it('shows toast.error when listBothFiles throws', async () => {
    mockListBothFiles.mockRejectedValueOnce(new Error('disk read error'));
    render(<SyncFromRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('disk read error'));
    });
  });
});
