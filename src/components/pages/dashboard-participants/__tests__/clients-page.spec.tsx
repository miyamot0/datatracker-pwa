import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockMutateAsync = vi.hoisted(() => vi.fn());
const mockSetQueryData = vi.hoisted(() => vi.fn());
const mockRouterInvalidate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockToastPromise = vi.hoisted(() =>
  vi.fn(async (fn: () => Promise<unknown>, options?: { success?: () => string; error?: (e: Error) => string }) => {
    const result = await fn();
    options?.success?.();
    options?.error?.(new Error('mock error'));
    return result;
  }),
);
const mockAlert = vi.hoisted(() => vi.fn());

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: mockSetQueryData,
  },
}));

vi.mock('@/lib/strings', () => ({
  CleanUpString: (v: string) => `[clean] ${v}`,
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(({ onSuccess }: { onSuccess?: (data: unknown) => Promise<void> | void }) => ({
    mutateAsync: async (payload: unknown) => {
      const data = await mockMutateAsync(payload);
      if (onSuccess) {
        await onSuccess(data);
      }
      return data;
    },
  })),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, params, children, className }: any) => (
    <a href={to} data-params={params ? JSON.stringify(params) : undefined} className={className}>
      {children}
    </a>
  ),
  useRouter: () => ({ invalidate: mockRouterInvalidate }),
  useRouterState: () => ({ matches: [{ routeId: '/clients' }] }),
}));

vi.mock('@/components/ui/data-table-column-header', () => ({
  DataTableColumnHeader: ({ title }: any) => <span>{title}</span>,
}));

vi.mock('@/components/ui/data-table-common', () => ({
  DataTable: ({ data, columns, callback, optionalButtons, filterCol }: any) => (
    <div>
      <div data-testid="filter-col">{filterCol}</div>
      <div>{columns[0].header({ column: { id: 'Individual' } })}</div>
      <div>{columns[1].header()}</div>
      {data.map((item: any, i: number) => (
        <div key={i} data-testid="client-row">
          <span>{item.Individual}</span>
          {columns[1].cell({ row: { original: item } })}
        </div>
      ))}
      <button onClick={() => callback(data)}>Trigger Delete Callback</button>
      {optionalButtons}
    </div>
  ),
}));

vi.mock('@/components/ui/tooltip-wrapper', () => ({
  default: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <div>Back</div>,
}));

vi.mock('sonner', () => ({
  toast: {
    promise: mockToastPromise,
  },
}));

import ClientsPage from '../clients-page';

const renderPage = () =>
  render(
    <ClientsPage
      Group="GroupA"
      Clients={['Client1', 'Client2']}
      Handle={{} as FileSystemDirectoryHandle}
      Settings={{} as any}
    />,
  );

describe('ClientsPage', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue([]);
    mockSetQueryData.mockReset();
    mockRouterInvalidate.mockReset();
    mockRouterInvalidate.mockResolvedValue(undefined);
    mockRouterInvalidate.mockImplementation(async (options?: { filter?: (match: { routeId: string }) => boolean }) => {
      options?.filter?.({ routeId: '/clients' });
      options?.filter?.({ routeId: '/other' });
    });
    mockToastPromise.mockClear();
    mockAlert.mockReset();

    vi.stubGlobal('alert', mockAlert);
  });

  it('renders title, description, and table actions', async () => {
    await renderPage();

    await expect.element(page.getByText('Client Directory: [clean] GroupA')).toBeInTheDocument();
    await expect.element(page.getByText('Select clients to develop and evaluate outcomes')).toBeInTheDocument();
    await expect.element(page.getByText('Client Name/ID')).toBeInTheDocument();
    await expect.element(page.getByText('Client Folder Actions')).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: 'Open Evaluations' }).first()).toBeInTheDocument();
  });

  it('delete callback returns when confirmation is false', async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false),
    );
    await renderPage();

    await page.getByRole('button', { name: 'Trigger Delete Callback' }).click();

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('delete callback mutates when confirmation is true', async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
    await renderPage();

    await page.getByRole('button', { name: 'Trigger Delete Callback' }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ Action: 'Delete', Group: 'GroupA', Individuals: ['Client1', 'Client2'] }),
    );
    expect(mockSetQueryData).toHaveBeenCalled();
    expect(mockRouterInvalidate).toHaveBeenCalled();
  });

  it('create button returns on canceled prompt', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => null),
    );
    await renderPage();

    await page.getByRole('button', { name: 'Create' }).click();

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('create button blocks duplicate and too-short names', async () => {
    vi.stubGlobal('prompt', vi.fn().mockReturnValueOnce('Client1').mockReturnValueOnce('abc'));
    await renderPage();

    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByRole('button', { name: 'Create' }).click();

    expect(mockAlert).toHaveBeenNthCalledWith(1, 'Client already exists.');
    expect(mockAlert).toHaveBeenNthCalledWith(2, 'Client name must be at least 4 characters long.');
  });

  it('create button adds client for valid prompt input', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => '  Client3  '),
    );
    await renderPage();

    await page.getByRole('button', { name: 'Create' }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ Action: 'Add', Individuals: ['Client3'] }));
  });
});
