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
    mockAlert.mockReset();

    vi.stubGlobal('alert', mockAlert);
  });

  it('returns on canceled prompt', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => null),
    );
    await renderComponent();

    await page.getByRole('button', { name: 'Create' }).click();

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('blocks duplicate and too-short names', async () => {
    vi.stubGlobal('prompt', vi.fn().mockReturnValueOnce('Client1').mockReturnValueOnce('abc'));
    await renderComponent();

    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByRole('button', { name: 'Create' }).click();

    expect(mockAlert).toHaveBeenNthCalledWith(1, 'Client already exists.');
    expect(mockAlert).toHaveBeenNthCalledWith(2, 'Client name must be at least 4 characters long.');
  });

  it('adds client for valid prompt input', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => '  Client3  '),
    );
    await renderComponent();

    await page.getByRole('button', { name: 'Create' }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ Action: 'Add', Individuals: ['Client3'] }));
  });
});
