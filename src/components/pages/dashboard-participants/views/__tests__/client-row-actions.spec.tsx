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

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: mockSetQueryData,
  },
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

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

vi.mock('sonner', () => ({
  toast: {
    promise: mockToastPromise,
  },
}));

import ClientRowActions from '../client-row-actions';

const renderComponent = (settingsOverride: Record<string, unknown> = {}) =>
  render(
    <ClientRowActions
      Group="GroupA"
      Individual="Client1"
      Clients={['Client1', 'Client2']}
      Handle={{} as FileSystemDirectoryHandle}
      Settings={{ EnableFileDeletion: true, ...settingsOverride } as any}
    />,
  );

describe('ClientRowActions', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue([]);
    mockSetQueryData.mockReset();
    mockRouterInvalidate.mockReset();
    mockRouterInvalidate.mockResolvedValue(undefined);
    mockRouterInvalidate.mockImplementation(async (options?: { filter?: (match: { routeId: string }) => boolean }) => {
      options?.filter?.({ routeId: '/clients' });
    });
    mockToastPromise.mockClear();
  });

  it('renders the Open Evaluations link', async () => {
    await renderComponent();

    await expect.element(page.getByRole('link', { name: 'Open Evaluations' })).toBeInTheDocument();
  });

  it('does not show the De-Identify Case dropdown when file deletion is disabled', async () => {
    await renderComponent({ EnableFileDeletion: false });

    expect(await page.getByText('De-Identify Case').query()).toBeNull();
  });

  it('de-identify dialog submits with RedactComments true by default', async () => {
    await renderComponent();

    await page.getByText('De-Identify Case').first().click();

    await expect.element(page.getByText(/Provide a new name/)).toBeInTheDocument();

    await page.getByLabelText('New Name').fill('New Client Name');
    await page.getByLabelText('Replacement Year').fill('2000');

    await page.getByRole('button', { name: 'Submit' }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        Group: 'GroupA',
        SourceIndividual: 'Client1',
        NewIndividual: 'New Client Name',
        ReplacementYear: 2000,
        RedactComments: true,
      }),
    );
  });

  it('de-identify dialog submits with RedactComments false when unchecked', async () => {
    await renderComponent();

    await page.getByText('De-Identify Case').first().click();

    await page.getByLabelText('New Name').fill('New Client Name');
    await page.getByLabelText('Replacement Year').fill('2000');
    await page.getByRole('checkbox', { name: 'Redact session comments' }).click();

    await page.getByRole('button', { name: 'Submit' }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ RedactComments: false }));
  });

  it('de-identify submit button stays disabled when the name duplicates an existing client', async () => {
    await renderComponent();

    await page.getByText('De-Identify Case').first().click();

    await page.getByLabelText('New Name').fill('Client2');
    await page.getByLabelText('Replacement Year').fill('2000');

    await expect.element(page.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });
});
