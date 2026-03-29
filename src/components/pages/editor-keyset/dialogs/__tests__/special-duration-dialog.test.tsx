import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ----- Module mocks -----

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
    setDefaultOptions: vi.fn(),
  },
}));

vi.mock('@/lib/notifications', () => ({
  displayConditionalNotification: vi.fn(),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenuItem: ({ children, onSelect, className, onClick }: any) => (
    <button
      className={className}
      onClick={(e) => {
        onClick?.(e);
        onSelect?.(e);
      }}
    >
      {children}
    </button>
  ),
}));

// ----- Import under test -----

import SpecialDurationDialogKeyCreator from '../special-duration-dialog';
import { KeySet } from '@/types/keyset';

// ----- Helpers -----

const makeKeyset = (): KeySet =>
  ({
    id: 'ks1',
    Name: 'TestSet',
    FrequencyKeys: [],
    DurationKeys: [],
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
    createdAt: new Date(),
    lastModified: new Date(),
  }) as any;

// ----- Tests -----

describe('SpecialDurationDialogKeyCreator', () => {
  const mockCallback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Add Special Timing Key trigger', () => {
    render(<SpecialDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    expect(screen.getByText('Add Special Timing Key')).not.toBeNull();
  });

  it('dialog is closed initially (title not visible)', () => {
    render(<SpecialDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    expect(screen.queryByText('Special Duration Key Creator')).toBeNull();
  });

  it('opens dialog when trigger is clicked', () => {
    render(<SpecialDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Special Timing Key'));
    expect(screen.getByText('Special Duration Key Creator')).not.toBeNull();
  });

  it('shows dialog description when open', () => {
    render(<SpecialDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Special Timing Key'));
    expect(screen.getByText('Set key and relevant description')).not.toBeNull();
  });

  it('shows Period to Record input label when open', () => {
    render(<SpecialDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Special Timing Key'));
    expect(screen.getByText(/Period to Record/)).not.toBeNull();
  });

  it('shows Key Capture input label when open', () => {
    render(<SpecialDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Special Timing Key'));
    expect(screen.getByText(/Key Capture/)).not.toBeNull();
  });

  it('shows Create Key button when open', () => {
    render(<SpecialDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Special Timing Key'));
    expect(screen.getByText('Create Key')).not.toBeNull();
  });

  it('description input updates on change', () => {
    render(<SpecialDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Special Timing Key'));
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Pause Timer' } });
    expect((inputs[0] as HTMLInputElement).value).toBe('Pause Timer');
  });

  it('calls Callback when valid input is provided and Create Key is clicked', () => {
    render(<SpecialDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Special Timing Key'));

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Pause Timer' } });
    fireEvent.keyDown(inputs[1], { key: 'p', keyCode: 80 });

    fireEvent.click(screen.getByText('Create Key'));
    expect(mockCallback).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ KeyDescription: 'Pause Timer' }),
    );
  });
});
