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

vi.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}));

// ----- Import under test -----

import LogicalDialogKeyCreator from '../logical-dialog';
import { KeySet } from '@/types/keyset';

// ----- Helpers -----

const makeKeyset = (): KeySet =>
  ({
    id: 'ks1',
    Name: 'TestSet',
    FrequencyKeys: [{ KeyName: 'a', KeyDescription: 'Hitting', KeyCode: 65 }],
    DurationKeys: [{ KeyName: 'b', KeyDescription: 'Running', KeyCode: 66 }],
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
    createdAt: new Date(),
    lastModified: new Date(),
  }) as any;

// Open the dialog by clicking the trigger
const openDialog = (container: HTMLElement) => {
  // The trigger is a DropdownMenuItem — find it by its text
  const trigger = screen.getByText('Add Derived Key');
  fireEvent.click(trigger);
};

// ----- Tests -----

describe('LogicalDialogKeyCreator', () => {
  const mockCallback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Add Derived Key trigger', () => {
    render(<LogicalDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    expect(screen.getByText('Add Derived Key')).not.toBeNull();
  });

  it('dialog is closed initially (title not visible)', () => {
    render(<LogicalDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    expect(screen.queryByText('Derived Key Creator')).toBeNull();
  });

  it('opens dialog when trigger is clicked', () => {
    const { container } = render(<LogicalDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    openDialog(container);
    expect(screen.getByText('Derived Key Creator')).not.toBeNull();
  });

  it('shows dialog description when open', () => {
    const { container } = render(<LogicalDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    openDialog(container);
    expect(screen.getByText('Set key and relevant description')).not.toBeNull();
  });

  it('shows Derived Key Name input when open', () => {
    const { container } = render(<LogicalDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    openDialog(container);
    expect(screen.getByText(/Derived Key Name/)).not.toBeNull();
  });

  it('shows Add Step button when open', () => {
    const { container } = render(<LogicalDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    openDialog(container);
    expect(screen.getByText('Add Step')).not.toBeNull();
  });

  it('shows Save Derived Key button when open', () => {
    const { container } = render(<LogicalDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    openDialog(container);
    expect(screen.getByText('Save Derived Key')).not.toBeNull();
  });

  it('shows Formula display when open', () => {
    const { container } = render(<LogicalDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    openDialog(container);
    expect(screen.getByText(/Formula:/)).not.toBeNull();
  });

  it('name input updates on change', () => {
    const { container } = render(<LogicalDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    openDialog(container);
    const nameInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(nameInput, { target: { value: 'Combined Score' } });
    expect((nameInput as HTMLInputElement).value).toBe('Combined Score');
  });

  it('calls Callback when valid name is provided and Save is clicked', () => {
    const { container } = render(<LogicalDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    openDialog(container);
    const nameInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(nameInput, { target: { value: 'Combined Score' } });
    fireEvent.click(screen.getByText('Save Derived Key'));
    expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ name: 'Combined Score' }));
  });
});
