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

import ScoredDurationDialogKeyCreator from '../scored-duration-dialog';
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

describe('ScoredDurationDialogKeyCreator', () => {
  const mockCallback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Add Scored Duration Key trigger', () => {
    render(<ScoredDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    expect(screen.getByText('Add Scored Duration Key')).not.toBeNull();
  });

  it('dialog is closed initially (title not visible)', () => {
    render(<ScoredDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    expect(screen.queryByText('Scored Duration Key Creator')).toBeNull();
  });

  it('opens dialog when trigger is clicked', () => {
    render(<ScoredDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Scored Duration Key'));
    expect(screen.getByText('Scored Duration Key Creator')).not.toBeNull();
  });

  it('shows dialog description when open', () => {
    render(<ScoredDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Scored Duration Key'));
    expect(screen.getByText('Set key and relevant description')).not.toBeNull();
  });

  it('shows Period to Record input label when open', () => {
    render(<ScoredDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Scored Duration Key'));
    expect(screen.getByText(/Period to Record/)).not.toBeNull();
  });

  it('shows Key Capture input label when open', () => {
    render(<ScoredDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Scored Duration Key'));
    expect(screen.getByText(/Key Capture/)).not.toBeNull();
  });

  it('shows Create Key button when open', () => {
    render(<ScoredDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Scored Duration Key'));
    expect(screen.getByText('Create Key')).not.toBeNull();
  });

  it('description input updates on change', () => {
    render(<ScoredDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Scored Duration Key'));
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Work Period' } });
    expect((inputs[0] as HTMLInputElement).value).toBe('Work Period');
  });

  it('calls Callback when valid input is provided and Create Key is clicked', () => {
    render(<ScoredDurationDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Scored Duration Key'));

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Work Period' } });
    fireEvent.keyDown(inputs[1], { key: 'w', keyCode: 87 });

    fireEvent.click(screen.getByText('Create Key'));
    expect(mockCallback).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ KeyDescription: 'Work Period' }),
    );
  });
});
