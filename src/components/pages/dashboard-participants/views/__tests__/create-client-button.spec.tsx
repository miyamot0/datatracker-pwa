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
  useRouter: () => ({ invalidate: mockRouterInvalidate }),
  useRouterState: () => ({ matches: [{ routeId: '/clients' }] }),
}));

vi.mock('@/components/ui/tooltip-wrapper', () => ({
  default: ({ children }: any) => <>{children}</>,
}));

vi.mock('sonner', () => ({
  toast: {
    promise: mockToastPromise,
  },
}));

import CreateClientButton from '../create-client-button';

const renderComponent = () =>
  render(
    <CreateClientButton Group="GroupA" Clients={['Client1', 'Client2']} Handle={{} as FileSystemDirectoryHandle} />,
  );

describe('CreateClientButton', () => {
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

  it('does not submit when the dialog is canceled', async () => {
    await renderComponent();

    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('blocks duplicate and too-short names inline', async () => {
    await renderComponent();

    await page.getByRole('button', { name: 'Create', exact: true }).click();
    const submit = page.getByRole('button', { name: 'Create client', exact: true });

    await page.getByLabelText('Client name').fill('abc');
    await expect.element(page.getByRole('alert')).toHaveTextContent('Client name must be at least 4 characters long.');
    await expect.element(submit).toBeDisabled();

    await page.getByLabelText('Client name').fill('client1');
    await expect.element(page.getByRole('alert')).toHaveTextContent('Client already exists.');
    await expect.element(submit).toBeDisabled();

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('adds client for valid dialog input', async () => {
    await renderComponent();

    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByLabelText('Client name').fill('  Client3  ');
    await page.getByRole('button', { name: 'Create client', exact: true }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ Action: 'Add', Individuals: ['Client3'] }));
  });
});
