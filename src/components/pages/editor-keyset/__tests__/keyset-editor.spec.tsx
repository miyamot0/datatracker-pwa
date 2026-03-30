import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockMutateAsync = vi.hoisted(() => vi.fn());
const mockInvalidate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockSetQueryData = vi.hoisted(() => vi.fn());
const mockInvalidateQueries = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockConfirm = vi.hoisted(() => vi.fn());

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: mockSetQueryData,
    invalidateQueries: mockInvalidateQueries,
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

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className }: any) => (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  ),
  buttonVariants: () => '',
}));

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate: mockInvalidate }),
  useRouterState: () => ({ matches: [{ routeId: '/test' }] }),
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <div>Back</div>,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock('@/lib/logic', () => ({
  generateFormula: vi.fn(() => 'A AND B'),
}));

vi.mock('../dialogs/frequency-dialog', () => ({
  default: ({ KeySet, Callback }: any) => (
    <button
      onClick={() => Callback(KeySet, { KeyDescription: 'Added Frequency', KeyName: 'F3', KeyCode: 73 }, 'Frequency')}
    >
      Add Frequency
    </button>
  ),
}));

vi.mock('../dialogs/duration-dialog', () => ({
  default: ({ KeySet, Callback }: any) => (
    <button
      onClick={() => Callback(KeySet, { KeyDescription: 'Added Duration', KeyName: 'D3', KeyCode: 74 }, 'Duration')}
    >
      Add Duration
    </button>
  ),
}));

vi.mock('../dialogs/logical-dialog', () => ({
  default: ({ Callback }: any) => (
    <button onClick={() => Callback({ id: 'logic-new', name: 'Derived New' })}>Add Derived</button>
  ),
}));

vi.mock('../dialogs/special-duration-dialog', () => ({
  default: ({ KeySet, Callback }: any) => (
    <button onClick={() => Callback(KeySet, { KeyDescription: 'Special Added', KeyName: 'S1', KeyCode: 80 })}>
      Add Special Duration
    </button>
  ),
}));

vi.mock('../dialogs/scored-duration-dialog', () => ({
  default: ({ KeySet, Callback }: any) => (
    <button onClick={() => Callback(KeySet, { KeyDescription: 'Scored Added', KeyName: 'SC1', KeyCode: 81 })}>
      Add Scored Duration
    </button>
  ),
}));

import KeySetEditor from '../keyset-editor';

const makeKeyset = () =>
  ({
    id: 'ks1',
    Name: 'Keyset 1',
    FrequencyKeys: [
      { KeyDescription: 'Freq 1', KeyName: 'F1', KeyCode: 70 },
      { KeyDescription: 'Freq 2', KeyName: 'F2', KeyCode: 71 },
    ],
    DurationKeys: [
      { KeyDescription: 'Dur 1', KeyName: 'D1', KeyCode: 68 },
      { KeyDescription: 'Dur 2', KeyName: 'D2', KeyCode: 69 },
    ],
    DerivedKeys: [{ id: 'logic-1', name: 'Derived 1' }],
    SpecialDurationKeys: [{ KeyDescription: 'Special 1', KeyName: 'S0', KeyCode: 75 }],
    ScorableDurationKeys: [{ KeyDescription: 'Scored 1', KeyName: 'SC0', KeyCode: 76 }],
    lastModified: new Date('2024-01-01T00:00:00.000Z'),
  }) as any;

const renderEditor = () =>
  render(
    <KeySetEditor
      Group="GroupA"
      Individual="ClientB"
      KeySetObject={makeKeyset()}
      Handle={{} as FileSystemDirectoryHandle}
    />,
  );

describe('KeySetEditor', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue([]);
    mockSetQueryData.mockReset();
    mockInvalidateQueries.mockReset();
    mockInvalidate.mockReset();
    mockConfirm.mockReset();
    mockConfirm.mockReturnValue(true);
    vi.stubGlobal('confirm', mockConfirm);
  });

  it('renders keyset tables and labels', async () => {
    await renderEditor();

    await expect.element(page.getByRole('heading', { name: 'KeySet Entries' })).toBeInTheDocument();
    await expect.element(page.getByText('Frequency Keys')).toBeInTheDocument();
    await expect.element(page.getByText('Duration Keys')).toBeInTheDocument();
    await expect.element(page.getByText('Derived 1 (Derived)')).toBeInTheDocument();
    await expect.element(page.getByText('Special 1 (Special Timing)')).toBeInTheDocument();
    await expect.element(page.getByText('Scored 1 (Scored Duration)')).toBeInTheDocument();
  });

  it('adds frequency, duration, derived, special, and scored keys', async () => {
    await renderEditor();

    await page.getByRole('button', { name: 'Add Frequency' }).click();
    await page.getByRole('button', { name: 'Add Duration' }).click();
    await page.getByRole('button', { name: 'Add Derived' }).click();
    await page.getByRole('button', { name: 'Add Special Duration' }).click();
    await page.getByRole('button', { name: 'Add Scored Duration' }).click();

    expect(mockMutateAsync).toHaveBeenCalledTimes(5);

    const payloads = mockMutateAsync.mock.calls.map((c) => c[0]);
    expect(payloads.some((p) => p.NewKeySet.FrequencyKeys.some((k: any) => k.KeyCode === 73))).toBe(true);
    expect(payloads.some((p) => p.NewKeySet.DurationKeys.some((k: any) => k.KeyCode === 74))).toBe(true);
    expect(payloads.some((p) => p.NewKeySet.DerivedKeys.some((k: any) => k.id === 'logic-new'))).toBe(true);
    expect(payloads.some((p) => p.NewKeySet.SpecialDurationKeys.some((k: any) => k.KeyCode === 80))).toBe(true);
    expect(payloads.some((p) => p.NewKeySet.ScorableDurationKeys.some((k: any) => k.KeyCode === 81))).toBe(true);
    expect(mockSetQueryData).toHaveBeenCalled();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['/', 'metaKeyboards'] });
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it('moves keys up and down', async () => {
    await renderEditor();

    const iconButtons = await page.getByRole('button', { name: '' }).all();
    await iconButtons[1].click();
    await iconButtons[3].click();

    expect(mockMutateAsync).toHaveBeenCalledTimes(2);
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: 'Update',
        NewKeySet: expect.objectContaining({
          FrequencyKeys: expect.arrayContaining([
            expect.objectContaining({ KeyName: 'F2' }),
            expect.objectContaining({ KeyName: 'F1' }),
          ]),
        }),
      }),
    );
  });

  it('handles move boundaries for first and last rows', async () => {
    await renderEditor();

    const iconButtons = await page.getByRole('button', { name: '' }).all();
    await iconButtons[0].click();
    await iconButtons[4].click();
    await iconButtons[11].click();

    expect(mockMutateAsync).toHaveBeenCalledTimes(3);
  });

  it('does not delete when confirmation is canceled', async () => {
    mockConfirm.mockReturnValue(false);
    await renderEditor();

    await page.getByRole('button', { name: 'Delete' }).first().click();

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('deletes key rows across all categories when confirmed', async () => {
    await renderEditor();

    const deleteButtons = await page.getByRole('button', { name: 'Delete' }).all();
    for (const btn of deleteButtons) {
      await btn.click();
    }

    expect(mockMutateAsync).toHaveBeenCalled();
    const payloads = mockMutateAsync.mock.calls.map((c) => c[0].NewKeySet);
    expect(payloads.some((p) => p.FrequencyKeys.length === 1)).toBe(true);
    expect(payloads.some((p) => p.DurationKeys.length === 1)).toBe(true);
    expect(payloads.some((p) => p.DerivedKeys.length === 0)).toBe(true);
    expect(payloads.some((p) => p.SpecialDurationKeys.length === 0)).toBe(true);
    expect(payloads.some((p) => p.ScorableDurationKeys.length === 0)).toBe(true);
  });
});
