// @ts-nocheck

import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
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
  ReliabilityDataTable: ({ data, direction, optionalButtons, callback }) => (
    <div data-testid="reliability-table">
      <span data-testid="table-direction">{direction}</span>
      {data.map((row) => (
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
  DataTableColumnHeader: ({ title }) => <span>{title}</span>,
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

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

// ----- Tests -----

describe('SyncFromRemoteTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListBothFiles.mockResolvedValue({ localFiles: [], remoteFiles: [] });
  });

  it('shows loading indicator initially', async () => {
    mockListBothFiles.mockImplementationOnce(
      () => new Promise<{ localFiles: string[]; remoteFiles: string[] }>(() => {}),
    );
    await render(<SyncFromRemoteTable Handle={makeHandle('local')} RemoteHandle={makeHandle('remote')} />);
    await expect.element(page.getByText('Loading files...')).toBeInTheDocument();
  });

  it('hides loading indicator after files load', async () => {
    await render(<SyncFromRemoteTable Handle={makeHandle('local')} RemoteHandle={makeHandle('remote')} />);
    await expect.element(page.getByTestId('table-direction')).toHaveTextContent('Local');
    expect(page.getByText('Loading files...').elements().length).toBe(0);
  });

  it('calls listBothFiles on mount with correct handles', async () => {
    const local = makeHandle('local');
    const remote = makeHandle('remote');
    await render(<SyncFromRemoteTable Handle={local} RemoteHandle={remote} />);
    await expect.element(page.getByTestId('table-direction')).toHaveTextContent('Local');
    expect(mockListBothFiles).toHaveBeenCalledWith(local, remote);
  });

  it('renders the table with direction="Local"', async () => {
    await render(<SyncFromRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await expect.element(page.getByTestId('table-direction')).toHaveTextContent('Local');
  });

  it('shows remote files that are not in local (unsynced)', async () => {
    mockListBothFiles.mockResolvedValue({
      localFiles: ['a.json'],
      remoteFiles: ['a.json', 'b.json'],
    });

    await render(<SyncFromRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await expect.element(page.getByText('b.json')).toBeInTheDocument();
  });

  it('does not show remote files that are already in local (synced)', async () => {
    mockListBothFiles.mockResolvedValue({
      localFiles: ['a.json'],
      remoteFiles: ['a.json', 'b.json'],
    });

    await render(<SyncFromRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await expect.element(page.getByText('b.json')).toBeInTheDocument();
    expect(page.getByText('a.json').elements().length).toBe(0);
  });

  it('renders no rows when all remote files are already local', async () => {
    mockListBothFiles.mockResolvedValue({
      localFiles: ['a.json', 'b.json'],
      remoteFiles: ['a.json', 'b.json'],
    });

    await render(<SyncFromRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await expect.element(page.getByTestId('table-direction')).toBeInTheDocument();
    expect(page.getByTestId('table-row').elements().length).toBe(0);
  });

  it('shows toast.error when listBothFiles throws', async () => {
    mockListBothFiles.mockRejectedValueOnce(new Error('disk read error'));

    await render(<SyncFromRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await flushMicrotasks();
    expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('disk read error'));
  });
});
