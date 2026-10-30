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

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({ setQueryData: mockSetQueryData }),
    useMutation: vi.fn(({ onSuccess }: { onSuccess?: (data: unknown) => Promise<void> | void }) => ({
      mutateAsync: async (payload: unknown) => {
        const data = await mockMutateAsync(payload);
        if (onSuccess) {
          await onSuccess(data);
        }
        return data;
      },
    })),
  };
});

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ to, params, children, className }: any) => (
      <a href={to} data-params={params ? JSON.stringify(params) : undefined} className={className}>
        {children}
      </a>
    ),
    useRouter: () => ({ invalidate: mockRouterInvalidate }),
    useRouterState: () => ({ matches: [{ routeId: '/groups' }] }),
  };
});

vi.mock('@/components/ui/data-table-column-header', () => ({
  DataTableColumnHeader: ({ title }: any) => <span>{title}</span>,
}));

vi.mock('@/components/ui/data-table-common', () => ({
  DataTable: ({ data, columns, callback, optionalButtons, filterCol }: any) => (
    <div>
      <div data-testid="filter-col">{filterCol}</div>
      <div>{columns[0].header({ column: { id: 'Group' } })}</div>
      <div>{columns[1].header()}</div>
      {data.map((item: any, i: number) => (
        <div key={i} data-testid="group-row">
          <span>{item.Group}</span>
          {columns[1].cell({ row: { original: item } })}
        </div>
      ))}
      <button onClick={() => callback(data)}>Trigger Delete Callback</button>
      {optionalButtons}
    </div>
  ),
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <div>Back</div>,
}));

vi.mock('sonner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sonner')>();
  return {
    ...actual,
    toast: {
      ...actual.toast,
      promise: mockToastPromise,
    },
  };
});

import AuthorizedDisplayContent from '../authorized-display-content';
import { DemoDataFolderName } from '@/lib/query-mutate';

const renderPage = () =>
  render(
    <AuthorizedDisplayContent
      Groups={['Group1', 'Group2']}
      Settings={{} as any}
      Handle={{} as FileSystemDirectoryHandle}
    />,
  );

describe('AuthorizedDisplayContent', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue([]);
    mockSetQueryData.mockReset();
    mockRouterInvalidate.mockReset();
    mockRouterInvalidate.mockResolvedValue(undefined);
    mockRouterInvalidate.mockImplementation(async (options?: { filter?: (match: { routeId: string }) => boolean }) => {
      options?.filter?.({ routeId: '/groups' });
      options?.filter?.({ routeId: '/other' });
    });
    mockToastPromise.mockClear();
  });

  it('renders headings and group action links', async () => {
    await renderPage();

    await expect.element(page.getByText('Directory of Groups')).toBeInTheDocument();
    await expect.element(page.getByText('Open Group to Load Relevant Client Data')).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: 'Open Group' }).first()).toBeInTheDocument();
    await expect.element(page.getByText('Client Group Folder')).toBeInTheDocument();
    await expect.element(page.getByText('Group Folder Actions')).toBeInTheDocument();
  });

  it('delete callback returns when confirmation is canceled', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Trigger Delete Callback' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('delete callback mutates when confirmation is accepted', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Trigger Delete Callback' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ Action: 'Delete', Group: ['Group1', 'Group2'] }),
    );
    expect(mockSetQueryData).toHaveBeenCalled();
    expect(mockRouterInvalidate).toHaveBeenCalled();
  });

  it('extract example folder creates demo data when confirmed', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Extract Example Folder' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Extract', exact: true }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ Action: 'Demo', Group: [DemoDataFolderName] }),
    );
  });

  it('extract example folder canceled path does not mutate', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Extract Example Folder' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();

    expect(mockMutateAsync).not.toHaveBeenCalledWith(expect.objectContaining({ Action: 'Demo' }));
  });

  it('create button does not submit when the dialog is canceled', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('create button blocks duplicate and too-short names inline', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Create', exact: true }).click();
    const submit = page.getByRole('button', { name: 'Create group', exact: true });

    await page.getByLabelText('Group name').fill('abc');
    await expect.element(page.getByRole('alert')).toHaveTextContent('Group name must be at least 4 characters long.');
    await expect.element(submit).toBeDisabled();

    await page.getByLabelText('Group name').fill('Group1');
    await expect.element(page.getByRole('alert')).toHaveTextContent('Group already exists.');
    await expect.element(submit).toBeDisabled();

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('create button adds group with trimmed input', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByLabelText('Group name').fill('  Group3  ');
    await page.getByRole('button', { name: 'Create group', exact: true }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ Action: 'Add', Group: ['Group3'] }));
  });
});
