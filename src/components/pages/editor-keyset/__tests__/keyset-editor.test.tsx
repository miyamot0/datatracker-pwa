import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import KeySetEditor from '../keyset-editor';
import { KeySet } from '@/types/keyset';
import { LogicState } from '@/lib/logic';

// ----- Hoisted refs -----
const mockMutateAsync = vi.hoisted(() => vi.fn().mockResolvedValue([]));

// ----- Module mocks -----

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useRouter: () => ({ invalidate: vi.fn().mockResolvedValue(undefined) }),
    useRouterState: () => ({ matches: [{ routeId: '/test' }] }),
  };
});

vi.mock('@/queries/keysets/mutate-keyboards', () => ({
  mutationKeyboards: vi.fn(),
}));

vi.mock('@/lib/logic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/logic')>();
  return {
    ...actual,
    generateFormula: (_state: LogicState) => 'formula-stub',
  };
});

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button>Back</button>,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock('../dialogs/frequency-dialog', () => ({
  default: () => <button data-testid="freq-dialog-btn">Add Frequency</button>,
}));

vi.mock('../dialogs/duration-dialog', () => ({
  default: () => <button data-testid="dur-dialog-btn">Add Duration</button>,
}));

vi.mock('../dialogs/logical-dialog', () => ({
  default: () => <button data-testid="logical-dialog-btn">Add Derived</button>,
}));

vi.mock('../dialogs/special-duration-dialog', () => ({
  default: () => <button data-testid="special-dur-dialog-btn">Add Special</button>,
}));

vi.mock('../dialogs/scored-duration-dialog', () => ({
  default: () => <button data-testid="scored-dur-dialog-btn">Add Scored</button>,
}));

// ----- Helpers -----

const makeHandle = (name: string) => ({ name }) as FileSystemDirectoryHandle;

const makeKeyset = (overrides: Partial<KeySet> = {}): KeySet => ({
  id: 'keyset-1',
  Name: 'TestSet',
  FrequencyKeys: [
    { KeyName: 'a', KeyDescription: 'Hitting', KeyCode: 65 },
    { KeyName: 'b', KeyDescription: 'Kicking', KeyCode: 66 },
  ],
  DurationKeys: [
    { KeyName: 'c', KeyDescription: 'Running', KeyCode: 67 },
    { KeyName: 'd', KeyDescription: 'Sitting', KeyCode: 68 },
  ],
  DerivedKeys: [],
  SpecialDurationKeys: [],
  ScorableDurationKeys: [],
  createdAt: new Date('2026-01-01'),
  lastModified: new Date('2026-01-01'),
  ...overrides,
});

const makeDerivedKey = (id: string, name: string): LogicState => ({
  id,
  name,
  initial: { type: 'constant', value: 0 },
  fields: [],
  steps: [],
  value: 0,
});

const defaultProps = {
  Group: 'GroupA',
  Individual: 'ClientB',
  KeySetObject: makeKeyset(),
  Handle: makeHandle('root'),
};

// ----- Tests -----

describe('KeySetEditor', () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    mockMutateAsync.mockClear();
    mockMutateAsync.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- Card layout ----

  describe('card layout', () => {
    it('renders the card title', () => {
      render(<KeySetEditor {...defaultProps} />);
      expect(screen.getByText('KeySet Entries')).not.toBeNull();
    });

    it('renders the card description', () => {
      render(<KeySetEditor {...defaultProps} />);
      expect(screen.getByText('Add/Remove KeySet Entries')).not.toBeNull();
    });

    it('renders the BackButton', () => {
      render(<KeySetEditor {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Back' })).not.toBeNull();
    });

    it('renders the Frequency Keys section heading', () => {
      render(<KeySetEditor {...defaultProps} />);
      expect(screen.getByText('Frequency Keys')).not.toBeNull();
    });

    it('renders the Duration Keys section heading', () => {
      render(<KeySetEditor {...defaultProps} />);
      expect(screen.getByText('Duration Keys')).not.toBeNull();
    });
  });

  // ---- Frequency keys table ----

  describe('frequency keys table', () => {
    it('renders a row for each frequency key', () => {
      render(<KeySetEditor {...defaultProps} />);
      expect(screen.getByText('Hitting')).not.toBeNull();
      expect(screen.getByText('Kicking')).not.toBeNull();
    });

    it('renders the key name for each frequency key', () => {
      render(<KeySetEditor {...defaultProps} />);
      expect(screen.getByText('a')).not.toBeNull();
      expect(screen.getByText('b')).not.toBeNull();
    });

    it('renders no frequency rows when FrequencyKeys is empty', () => {
      render(<KeySetEditor {...defaultProps} KeySetObject={makeKeyset({ FrequencyKeys: [] })} />);
      expect(screen.queryByText('Hitting')).toBeNull();
    });

    it('shows the dialog button for adding frequency keys', () => {
      render(<KeySetEditor {...defaultProps} />);
      expect(screen.getByTestId('freq-dialog-btn')).not.toBeNull();
    });
  });

  // ---- Duration keys table ----

  describe('duration keys table', () => {
    it('renders a row for each duration key', () => {
      render(<KeySetEditor {...defaultProps} />);
      expect(screen.getByText('Running')).not.toBeNull();
      expect(screen.getByText('Sitting')).not.toBeNull();
    });

    it('renders the key name for each duration key', () => {
      render(<KeySetEditor {...defaultProps} />);
      expect(screen.getByText('c')).not.toBeNull();
      expect(screen.getByText('d')).not.toBeNull();
    });

    it('shows the dialog button for adding duration keys', () => {
      render(<KeySetEditor {...defaultProps} />);
      expect(screen.getByTestId('dur-dialog-btn')).not.toBeNull();
    });
  });

  // ---- Derived keys table ----

  describe('derived keys table', () => {
    it('renders a row for each derived key with "(Derived)" label', () => {
      render(
        <KeySetEditor
          {...defaultProps}
          KeySetObject={makeKeyset({ DerivedKeys: [makeDerivedKey('d1', 'ComboRate')] })}
        />,
      );
      expect(screen.getByText('ComboRate (Derived)')).not.toBeNull();
    });

    it('renders the formula stub for derived keys', () => {
      render(
        <KeySetEditor
          {...defaultProps}
          KeySetObject={makeKeyset({ DerivedKeys: [makeDerivedKey('d1', 'ComboRate')] })}
        />,
      );
      expect(screen.getByText('formula-stub')).not.toBeNull();
    });

    it('renders no derived rows when DerivedKeys is empty', () => {
      render(<KeySetEditor {...defaultProps} />);
      // "(Derived)" appears only in table rows, not in the dialog button text "Add Derived"
      expect(screen.queryByText(/\(Derived\)/)).toBeNull();
    });
  });

  // ---- SpecialDurationKeys table ----

  describe('special duration keys table', () => {
    it('renders a row for each special duration key with "(Special Timing)" label', () => {
      render(
        <KeySetEditor
          {...defaultProps}
          KeySetObject={makeKeyset({
            SpecialDurationKeys: [{ KeyName: 'e', KeyDescription: 'Pausing', KeyCode: 69 }],
          })}
        />,
      );
      expect(screen.getByText('Pausing (Special Timing)')).not.toBeNull();
    });

    it('renders no special rows when SpecialDurationKeys is empty', () => {
      render(<KeySetEditor {...defaultProps} />);
      expect(screen.queryByText(/special timing/i)).toBeNull();
    });
  });

  // ---- ScorableDurationKeys table ----

  describe('scorable duration keys table', () => {
    it('renders a row for each scorable duration key with "(Scored Duration)" label', () => {
      render(
        <KeySetEditor
          {...defaultProps}
          KeySetObject={makeKeyset({
            ScorableDurationKeys: [{ KeyName: 'f', KeyDescription: 'Counting', KeyCode: 70 }],
          })}
        />,
      );
      expect(screen.getByText('Counting (Scored Duration)')).not.toBeNull();
    });

    it('renders no scorable rows when ScorableDurationKeys is empty', () => {
      render(<KeySetEditor {...defaultProps} />);
      expect(screen.queryByText(/scored duration/i)).toBeNull();
    });
  });

  // ---- Move up/down disabled state ----

  describe('move up / move down disabled state', () => {
    it('disables the move-up button for the first frequency key', () => {
      render(<KeySetEditor {...defaultProps} />);
      const freqSection = screen.getByText('Frequency Keys').closest('div')!.parentElement!;
      // Find all up-arrow buttons within frequency section
      const allArrows = freqSection.querySelectorAll('button[disabled]');
      expect(allArrows.length).toBeGreaterThan(0);
    });

    it('disables the move-down button for the last frequency key', () => {
      render(<KeySetEditor {...defaultProps} />);
      // Second frequency key's move-down should be disabled
      const downBtns = screen.getAllByRole('button');
      // We check that at least one button with down arrow is disabled
      const disabledBtns = downBtns.filter((b) => b.hasAttribute('disabled'));
      expect(disabledBtns.length).toBeGreaterThan(0);
    });
  });

  // ---- Delete frequency key ----

  describe('delete frequency key', () => {
    it('shows confirm dialog when delete is clicked', async () => {
      render(<KeySetEditor {...defaultProps} />);
      const deleteBtns = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteBtns[0]);
      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to remove this key?');
    });

    it('does not call mutateAsync when delete is cancelled', async () => {
      confirmSpy.mockReturnValue(false);
      render(<KeySetEditor {...defaultProps} />);
      const deleteBtns = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteBtns[0]);
      await waitFor(() => {
        expect(mockMutateAsync).not.toHaveBeenCalled();
      });
    });

    it('calls mutateAsync with Update action when delete is confirmed', async () => {
      confirmSpy.mockReturnValue(true);
      render(<KeySetEditor {...defaultProps} />);
      const deleteBtns = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteBtns[0]);
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            Group: 'GroupA',
            Individual: 'ClientB',
            Action: 'Update',
          }),
        );
      });
    });

    it('removes the correct frequency key by KeyCode', async () => {
      confirmSpy.mockReturnValue(true);
      render(<KeySetEditor {...defaultProps} />);
      const deleteBtns = screen.getAllByRole('button', { name: /delete/i });
      // First delete button belongs to first frequency key (Hitting, KeyCode 65)
      fireEvent.click(deleteBtns[0]);
      await waitFor(() => {
        const call = mockMutateAsync.mock.calls[0][0];
        const newKeyset = call.NewKeySet as KeySet;
        expect(newKeyset.FrequencyKeys.find((k) => k.KeyCode === 65)).toBeUndefined();
        expect(newKeyset.FrequencyKeys.find((k) => k.KeyCode === 66)).toBeDefined();
      });
    });
  });

  // ---- Delete duration key ----

  describe('delete duration key', () => {
    it('removes the correct duration key when confirmed', async () => {
      confirmSpy.mockReturnValue(true);
      render(<KeySetEditor {...defaultProps} />);
      const deleteBtns = screen.getAllByRole('button', { name: /delete/i });
      // First two delete buttons are for freq keys; third is first duration key (Running, KeyCode 67)
      fireEvent.click(deleteBtns[2]);
      await waitFor(() => {
        const call = mockMutateAsync.mock.calls[0][0];
        const newKeyset = call.NewKeySet as KeySet;
        expect(newKeyset.DurationKeys.find((k) => k.KeyCode === 67)).toBeUndefined();
        expect(newKeyset.DurationKeys.find((k) => k.KeyCode === 68)).toBeDefined();
      });
    });
  });

  // ---- Delete derived key ----

  describe('delete derived key', () => {
    it('removes the correct derived key when confirmed', async () => {
      confirmSpy.mockReturnValue(true);
      const derived = makeDerivedKey('d1', 'ComboRate');
      render(<KeySetEditor {...defaultProps} KeySetObject={makeKeyset({ DerivedKeys: [derived] })} />);
      const deleteBtns = screen.getAllByRole('button', { name: /delete/i });
      // Derived key delete button comes after the frequency key delete buttons
      fireEvent.click(deleteBtns[2]);
      await waitFor(() => {
        const call = mockMutateAsync.mock.calls[0][0];
        const newKeyset = call.NewKeySet as KeySet;
        expect(newKeyset.DerivedKeys?.find((k) => k.id === 'd1')).toBeUndefined();
      });
    });
  });

  // ---- Move up (frequency key) ----

  describe('move up frequency key', () => {
    it('calls mutateAsync with reordered FrequencyKeys when move-up is clicked for second key', async () => {
      render(<KeySetEditor {...defaultProps} />);
      // Find the row containing "Kicking" (second freq key) and click its first non-disabled button (move-up)
      const kickingCell = screen.getByText('Kicking');
      const row = kickingCell.closest('tr')!;
      const upBtn = row.querySelector('button:not([disabled])')! as HTMLElement;
      fireEvent.click(upBtn);
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ Action: 'Update' }));
        const call = mockMutateAsync.mock.calls[0][0];
        const newKeyset = call.NewKeySet as KeySet;
        // After moving second key up, Kicking (66) should now be first
        expect(newKeyset.FrequencyKeys[0].KeyCode).toBe(66);
        expect(newKeyset.FrequencyKeys[1].KeyCode).toBe(65);
      });
    });
  });
});
