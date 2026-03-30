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

const mockInvalidateFilter = vi.hoisted(() => ({ fn: null as ((match: { routeId: string }) => boolean) | null }));

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    invalidate: (opts: { filter: (match: { routeId: string }) => boolean; sync: boolean }) => {
      mockInvalidateFilter.fn = opts.filter;
      return mockInvalidate(opts);
    },
  }),
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

  it('moves frequency keys up via ArrowUp button', async () => {
    await renderEditor();

    // F2 row: ArrowUp is enabled (index=1>0), ArrowDown is disabled (last item)
    const freq2Row = page.getByRole('row').filter({ hasText: 'Freq 2' });
    const freq2Buttons = await freq2Row.getByRole('button').all();
    await freq2Buttons[0].click();
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: 'Update',
        NewKeySet: expect.objectContaining({
          FrequencyKeys: [expect.objectContaining({ KeyName: 'F2' }), expect.objectContaining({ KeyName: 'F1' })],
        }),
      }),
    );
  });

  it('moves duration keys up and down', async () => {
    await renderEditor();

    // Find the row containing "Dur 2" and click its first button (ArrowUp - enabled for last row)
    const dur2Row = page.getByRole('row').filter({ hasText: 'Dur 2' });
    const dur2Buttons = await dur2Row.getByRole('button').all();
    // D2 is the last duration row: up=enabled, down=disabled, Delete
    await dur2Buttons[0].click();
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: 'Update',
        NewKeySet: expect.objectContaining({
          DurationKeys: [expect.objectContaining({ KeyName: 'D2' }), expect.objectContaining({ KeyName: 'D1' })],
        }),
      }),
    );

    mockMutateAsync.mockClear();

    // Find the row containing "Dur 1" and click its second button (ArrowDown)
    const dur1Row = page.getByRole('row').filter({ hasText: 'Dur 1' });
    const dur1Buttons = await dur1Row.getByRole('button').all();
    // D1 is the first duration row: up=disabled, down=enabled, Delete
    await dur1Buttons[1].click();
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: 'Update',
        NewKeySet: expect.objectContaining({
          DurationKeys: expect.arrayContaining([expect.objectContaining({ KeyName: 'D1' })]),
        }),
      }),
    );
  });

  it('router.invalidate filter matches current route and session keysets route', async () => {
    await renderEditor();

    // Trigger a mutation so onSuccess fires and router.invalidate is called.
    await page.getByRole('button', { name: 'Add Frequency' }).click();

    expect(mockInvalidate).toHaveBeenCalled();
    expect(mockInvalidateFilter.fn).not.toBeNull();

    const filter = mockInvalidateFilter.fn!;
    // Current routeId = '/test' → matches
    expect(filter({ routeId: '/test' })).toBe(true);
    // Session keysets route → matches
    expect(filter({ routeId: '/session/$group/$individual/keysets/' })).toBe(true);
    // Unrelated route → does not match
    expect(filter({ routeId: '/other' })).toBe(false);
  });

  it('covers || [] fallback branches when SpecialDurationKeys and ScorableDurationKeys are undefined', async () => {
    const keysetWithUndefined = {
      id: 'ks3',
      Name: 'Partial Keyset',
      FrequencyKeys: [{ KeyDescription: 'Freq 1', KeyName: 'F1', KeyCode: 70 }],
      DurationKeys: [{ KeyDescription: 'Dur 1', KeyName: 'D1', KeyCode: 68 }],
      DerivedKeys: [],
      SpecialDurationKeys: undefined as any,
      ScorableDurationKeys: undefined as any,
      lastModified: new Date('2024-01-01T00:00:00.000Z'),
    } as any;

    render(
      <KeySetEditor
        Group="GroupA"
        Individual="ClientB"
        KeySetObject={keysetWithUndefined}
        Handle={{} as FileSystemDirectoryHandle}
      />,
    );

    // Add Derived triggers addDerivedKeyCallback → SpecialDurationKeys || [] with undefined
    await page.getByRole('button', { name: 'Add Derived' }).click();
    // Add Special Duration triggers addSpecialDurationKeyCallback → SpecialDurationKeys || []
    await page.getByRole('button', { name: 'Add Special Duration' }).click();
    // Add Scored Duration triggers addScoredDurationKeyCallback → ScorableDurationKeys || []
    await page.getByRole('button', { name: 'Add Scored Duration' }).click();

    expect(mockMutateAsync).toHaveBeenCalledTimes(3);
    const payloads = mockMutateAsync.mock.calls.map((c) => c[0].NewKeySet);
    // DerivedKeys was [], now has 1 entry
    expect(payloads.some((p) => p.DerivedKeys?.some((k: any) => k.id === 'logic-new'))).toBe(true);
    // SpecialDurationKeys was undefined, now has 1 entry
    expect(payloads.some((p) => p.SpecialDurationKeys?.some((k: any) => k.KeyCode === 80))).toBe(true);
    // ScorableDurationKeys was undefined, now has 1 entry
    expect(payloads.some((p) => p.ScorableDurationKeys?.some((k: any) => k.KeyCode === 81))).toBe(true);
  });
});
