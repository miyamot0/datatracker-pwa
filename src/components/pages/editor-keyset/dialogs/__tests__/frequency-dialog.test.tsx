import React from 'react';
import { render } from '@testing-library/react';
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

vi.mock('@/components/ui/tooltip-wrapper', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

// ----- Import under test -----

import FrequencyDialogKeyCreator from '../frequency-dialog';
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

describe('FrequencyDialogKeyCreator', () => {
  const mockCallback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Add Key trigger button', () => {
    render(<FrequencyDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    expect(screen.getByText('Add Key')).not.toBeNull();
  });

  it('dialog is closed initially (title not visible)', () => {
    render(<FrequencyDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    expect(screen.queryByText('Frequency Key Creator')).toBeNull();
  });

  it('opens dialog when Add Key is clicked', () => {
    render(<FrequencyDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Key'));
    expect(screen.getByText('Frequency Key Creator')).not.toBeNull();
  });

  it('shows dialog description when open', () => {
    render(<FrequencyDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Key'));
    expect(screen.getByText('Set key and relevant description')).not.toBeNull();
  });

  it('shows Event to Record input label when open', () => {
    render(<FrequencyDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Key'));
    expect(screen.getByText(/Event to Record/)).not.toBeNull();
  });

  it('shows Key Capture input label when open', () => {
    render(<FrequencyDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Key'));
    expect(screen.getByText(/Key Capture/)).not.toBeNull();
  });

  it('shows Create Key button when open', () => {
    render(<FrequencyDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Key'));
    expect(screen.getByText('Create Key')).not.toBeNull();
  });

  it('description input updates on change', () => {
    render(<FrequencyDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Key'));
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Aggression' } });
    expect((inputs[0] as HTMLInputElement).value).toBe('Aggression');
  });

  it('calls Callback with Frequency type when valid input is provided', () => {
    render(<FrequencyDialogKeyCreator KeySet={makeKeyset()} Callback={mockCallback} />);
    fireEvent.click(screen.getByText('Add Key'));

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Aggression' } });
    fireEvent.keyDown(inputs[1], { key: 'a', keyCode: 65 });

    fireEvent.click(screen.getByText('Create Key'));
    expect(mockCallback).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ KeyDescription: 'Aggression' }),
      'Frequency',
    );
  });
});
