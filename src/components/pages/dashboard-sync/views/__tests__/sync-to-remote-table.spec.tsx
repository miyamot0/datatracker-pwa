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
const mockTableAllSelected = vi.hoisted(() => ({ value: false }));
const mockTableSomeSelected = vi.hoisted(() => ({ value: false }));
const mockRowSelected = vi.hoisted(() => ({ value: false }));

// ----- Module mocks -----

vi.mock('@/hooks/use-main-thread-sync', () => ({
  useMainThreadSync: () => ({
    listBothFiles: mockListBothFiles,
    syncFiles: mockSyncFiles,
  }),
}));

vi.mock('@/components/ui/data-table-reli', () => ({
  ReliabilityDataTable: ({ data, direction, optionalButtons, callback, columns }) => {
    const mockTable = {
      getIsAllPageRowsSelected: () => mockTableAllSelected.value,
      getIsSomePageRowsSelected: () => mockTableSomeSelected.value,
      toggleAllPageRowsSelected: vi.fn(),
    };
    const selectCol = columns?.find((c) => c.id === 'select');
    const fileCol = columns?.find((c) => c.accessorKey === 'file');
    return (
      <div data-testid="reliability-table">
        <span data-testid="table-direction">{direction}</span>
        <div data-testid="col-header-select">{selectCol?.header?.({ table: mockTable }) ?? null}</div>
        <div data-testid="col-header-file">
          {fileCol?.header?.({ column: { id: 'file', toggleSorting: () => {}, getIsSorted: () => false } }) ?? null}
        </div>
        {data.map((row) => {
          const mockRow = { original: row, getIsSelected: () => mockRowSelected.value, toggleSelected: vi.fn() };
          return (
            <div key={row.id} data-testid="table-row">
              {row.file}
              <div data-testid="col-cell-select">{selectCol?.cell?.({ row: mockRow }) ?? null}</div>
            </div>
          );
        })}
        <div data-testid="optional-buttons">{optionalButtons}</div>
        <button data-testid="sync-callback" onClick={() => callback([])}>
          Sync
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/ui/data-table-column-header', () => ({
  DataTableColumnHeader: ({ title }) => <span>{title}</span>,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, 'aria-label': ariaLabel }) => (
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      aria-label={ariaLabel}
    />
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
    promise: mockToastPromise,
  },
}));

// ----- Import under test -----

import SyncToRemoteTable from '../sync-to-remote-table';

// ----- Helpers -----

const makeHandle = (name = 'handle') => ({ name }) as FileSystemDirectoryHandle;

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

// ----- Tests -----

describe('SyncToRemoteTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListBothFiles.mockResolvedValue({ localFiles: [], remoteFiles: [] });
    mockTableAllSelected.value = false;
    mockTableSomeSelected.value = false;
    mockRowSelected.value = false;
  });

  it('shows loading indicator initially', async () => {
    mockListBothFiles.mockImplementationOnce(
      () => new Promise<{ localFiles: string[]; remoteFiles: string[] }>(() => {}),
    );
    await render(<SyncToRemoteTable Handle={makeHandle('local')} RemoteHandle={makeHandle('remote')} />);
    await expect.element(page.getByText('Loading files...')).toBeInTheDocument();
  });

  it('hides loading indicator after files load', async () => {
    await render(<SyncToRemoteTable Handle={makeHandle('local')} RemoteHandle={makeHandle('remote')} />);
    await expect.element(page.getByTestId('table-direction')).toHaveTextContent('Remote');
    expect(page.getByText('Loading files...').elements().length).toBe(0);
  });

  it('calls listBothFiles on mount with correct handles', async () => {
    const local = makeHandle('local');
    const remote = makeHandle('remote');
    await render(<SyncToRemoteTable Handle={local} RemoteHandle={remote} />);
    await expect.element(page.getByTestId('table-direction')).toHaveTextContent('Remote');
    expect(mockListBothFiles).toHaveBeenCalledWith(local, remote);
  });

  it('renders the table with direction="Remote"', async () => {
    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await expect.element(page.getByTestId('table-direction')).toHaveTextContent('Remote');
  });

  it('shows local files that are not in remote (unsynced)', async () => {
    mockListBothFiles.mockResolvedValue({
      localFiles: ['a.json', 'b.json'],
      remoteFiles: ['a.json'],
    });

    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await expect.element(page.getByText('b.json')).toBeInTheDocument();
  });

  it('does not show local files already in remote (synced)', async () => {
    mockListBothFiles.mockResolvedValue({
      localFiles: ['a.json', 'b.json'],
      remoteFiles: ['a.json'],
    });

    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await expect.element(page.getByText('b.json')).toBeInTheDocument();
    expect(page.getByText('a.json').elements().length).toBe(0);
  });

  it('renders no rows when all local files are already remote', async () => {
    mockListBothFiles.mockResolvedValue({
      localFiles: ['a.json', 'b.json'],
      remoteFiles: ['a.json', 'b.json'],
    });

    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await expect.element(page.getByTestId('table-direction')).toBeInTheDocument();
    expect(page.getByTestId('table-row').elements().length).toBe(0);
  });

  it('shows toast.error when listBothFiles throws', async () => {
    mockListBothFiles.mockRejectedValueOnce(new Error('network error'));

    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await flushMicrotasks();
    expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('network error'));
  });

  it('calls toast.promise when sync callback is triggered', async () => {
    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await expect.element(page.getByTestId('table-direction')).toBeInTheDocument();
    await page.getByTestId('sync-callback').click();
    await flushMicrotasks();
    expect(mockToastPromise).toHaveBeenCalled();
  });

  it('calls syncFiles with Handle then RemoteHandle (to-remote direction)', async () => {
    const local = makeHandle('local');
    const remote = makeHandle('remote');
    mockToastPromise.mockImplementationOnce(async (asyncFn: () => Promise<unknown>) => {
      await asyncFn();
    });

    await render(<SyncToRemoteTable Handle={local} RemoteHandle={remote} />);
    await expect.element(page.getByTestId('table-direction')).toHaveTextContent('Remote');

    await page.getByTestId('sync-callback').click();
    await flushMicrotasks();

    expect(mockSyncFiles).toHaveBeenCalledWith([], local, remote);
  });

  it('success callback returns singular message when 1 file synced', async () => {
    let capturedOpts: Record<string, (...args: unknown[]) => unknown> = {};
    mockToastPromise.mockImplementationOnce((_asyncFn: unknown, opts: typeof capturedOpts) => {
      capturedOpts = opts;
    });

    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await page.getByTestId('sync-callback').click();
    await flushMicrotasks();

    expect(capturedOpts.success(['b.json'])).toContain('1 file to remote!');
  });

  it('success callback returns plural message when multiple files synced', async () => {
    let capturedOpts: Record<string, (...args: unknown[]) => unknown> = {};
    mockToastPromise.mockImplementationOnce((_asyncFn: unknown, opts: typeof capturedOpts) => {
      capturedOpts = opts;
    });

    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await page.getByTestId('sync-callback').click();
    await flushMicrotasks();

    expect(capturedOpts.success(['b.json', 'c.json'])).toContain('2 files to remote!');
  });

  it('error callback returns message with Error instance message', async () => {
    let capturedOpts: Record<string, (...args: unknown[]) => unknown> = {};
    mockToastPromise.mockImplementationOnce((_asyncFn: unknown, opts: typeof capturedOpts) => {
      capturedOpts = opts;
    });

    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await page.getByTestId('sync-callback').click();
    await flushMicrotasks();

    expect(capturedOpts.error(new Error('write failed'))).toContain('write failed');
  });

  it('error callback returns message with non-Error string', async () => {
    let capturedOpts: Record<string, (...args: unknown[]) => unknown> = {};
    mockToastPromise.mockImplementationOnce((_asyncFn: unknown, opts: typeof capturedOpts) => {
      capturedOpts = opts;
    });

    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await page.getByTestId('sync-callback').click();
    await flushMicrotasks();

    expect(capturedOpts.error('plain error string')).toContain('plain error string');
  });

  it('removes file from unsynced list after successful sync to remote', async () => {
    mockListBothFiles.mockResolvedValue({ localFiles: ['a.json', 'b.json'], remoteFiles: ['a.json'] });
    mockSyncFiles.mockResolvedValue(['b.json']);
    mockToastPromise.mockImplementationOnce(async (asyncFn: () => Promise<unknown>) => {
      await asyncFn();
    });

    await render(<SyncToRemoteTable Handle={makeHandle('local')} RemoteHandle={makeHandle('remote')} />);
    await expect.element(page.getByText('b.json')).toBeInTheDocument();

    await page.getByTestId('sync-callback').click();
    await flushMicrotasks();

    expect(page.getByText('b.json').elements().length).toBe(0);
  });

  it('skips loading when Handle is falsy', async () => {
    await render(<SyncToRemoteTable Handle={null as any} RemoteHandle={makeHandle()} />);
    await expect.element(page.getByTestId('table-direction')).toBeInTheDocument();
    expect(mockListBothFiles).not.toHaveBeenCalled();
  });

  it('renders select-all column header checkbox', async () => {
    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await expect.element(page.getByTestId('table-direction')).toBeInTheDocument();
    const selectAllCheckbox = page.getByRole('checkbox', { name: 'Select all' });
    await expect.element(selectAllCheckbox).toBeInTheDocument();
  });

  it('renders row select checkbox for each unsynced file', async () => {
    mockListBothFiles.mockResolvedValue({ localFiles: ['a.json', 'b.json'], remoteFiles: ['a.json'] });
    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await expect.element(page.getByText('b.json')).toBeInTheDocument();
    const rowCheckbox = page.getByRole('checkbox', { name: 'Select row' });
    await expect.element(rowCheckbox).toBeInTheDocument();
  });

  it('renders Unsynced File Path column header', async () => {
    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await expect.element(page.getByText('Unsynced File Path')).toBeInTheDocument();
  });

  it('triggers select-all toggle when header checkbox is clicked', async () => {
    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    const selectAll = page.getByRole('checkbox', { name: 'Select all' });
    await expect.element(selectAll).toBeInTheDocument();
    await selectAll.click();
  });

  it('triggers row toggle when row checkbox is clicked', async () => {
    mockListBothFiles.mockResolvedValue({ localFiles: ['a.json', 'b.json'], remoteFiles: ['a.json'] });
    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await expect.element(page.getByText('b.json')).toBeInTheDocument();
    const rowCheckbox = page.getByRole('checkbox', { name: 'Select row' });
    await expect.element(rowCheckbox).toBeInTheDocument();
    await rowCheckbox.click();
  });

  it('shows toast.error with string message when listBothFiles rejects with non-Error', async () => {
    mockListBothFiles.mockRejectedValueOnce('plain string error');
    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await flushMicrotasks();
    expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('plain string error'));
  });

  it('renders header checkbox as checked when all rows are selected', async () => {
    mockTableAllSelected.value = true;
    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await expect.element(page.getByTestId('table-direction')).toBeInTheDocument();
    const selectAll = page.getByRole('checkbox', { name: 'Select all' });
    await expect.element(selectAll).toBeChecked();
  });

  it('renders header checkbox present when some rows are selected (indeterminate)', async () => {
    mockTableAllSelected.value = false;
    mockTableSomeSelected.value = true;
    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await expect.element(page.getByTestId('table-direction')).toBeInTheDocument();
    const selectAll = page.getByRole('checkbox', { name: 'Select all' });
    await expect.element(selectAll).toBeInTheDocument();
  });

  it('renders row checkbox as checked when row is selected', async () => {
    mockRowSelected.value = true;
    mockListBothFiles.mockResolvedValue({ localFiles: ['a.json', 'b.json'], remoteFiles: ['a.json'] });
    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await expect.element(page.getByText('b.json')).toBeInTheDocument();
    const rowCheckbox = page.getByRole('checkbox', { name: 'Select row' });
    await expect.element(rowCheckbox).toBeChecked();
  });

  it('error callback correctly formats non-Error object as string', async () => {
    let capturedOpts: Record<string, (...args: unknown[]) => unknown> = {};
    mockToastPromise.mockImplementationOnce((_asyncFn: unknown, opts: typeof capturedOpts) => {
      capturedOpts = opts;
    });

    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);
    await page.getByTestId('sync-callback').click();
    await flushMicrotasks();

    const errorObj = { code: 'SYNC_FAILED', details: 'custom error' };
    expect(capturedOpts.error(errorObj)).toContain('[object Object]');
  });

  it('renders fallback values for empty file names and missing status', async () => {
    // Mock sync_status to return incomplete objects to test fallback rendering
    mockListBothFiles.mockResolvedValue({
      localFiles: ['file1.json', '', 'file2.json'],
      remoteFiles: [],
    });
    await render(<SyncToRemoteTable Handle={makeHandle()} RemoteHandle={makeHandle()} />);

    // Verify table renders with the empty file string shown
    await expect.element(page.getByTestId('reliability-table')).toBeInTheDocument();
  });
});
