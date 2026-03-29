import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// ----- Module mocks -----

vi.mock('react-spreadsheet', () => ({
  default: ({ columnLabels }: { columnLabels: string[] }) => (
    <div data-testid="spreadsheet">
      {columnLabels?.map((label, i) => (
        <span key={i}>{label}</span>
      ))}
    </div>
  ),
}));

vi.mock('@/lib/calculations', () => ({
  processMultipleSessionDataWithKeys: vi.fn(() => []),
}));

vi.mock('@/lib/calculations/calculation-helpers', () => ({
  convertLegacyTimerType: vi.fn(() => 'Total'),
}));

vi.mock('@/lib/calculations/calculation-formatting', () => ({
  formatForSpreadsheet: vi.fn(() => [
    ['Session', 'Condition'],
    ['1', 'Baseline'],
  ]),
}));

const mockSetLocalCachedPrefs = vi.hoisted(() => vi.fn());
vi.mock('@/lib/local_storage', () => ({
  setLocalCachedPrefs: mockSetLocalCachedPrefs,
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button>Back</button>,
}));

vi.mock('@/components/ui/tooltip-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ----- Import under test -----

import ViewDurationResults from '../view-duration-results';

// ----- Helpers -----

const makeKeyset = () =>
  ({
    id: 'ks1',
    Name: 'TestSet',
    FrequencyKeys: [],
    DurationKeys: [{ KeyName: 'C', KeyDescription: 'Crying', KeyCode: 67 }],
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
  }) as any;

const makeShowKeys = () => [{ KeyName: 'C', KeyDescription: 'Crying', Visible: true }] as any[];

const defaultProps = {
  SessionTimer: 'End on Timer #1' as any,
  Results: [],
  LatestKeyset: makeKeyset(),
  ShowKeysDuration: makeShowKeys(),
  Group: 'GroupA',
  Individual: 'ClientB',
  Evaluation: 'Eval1',
};

// ----- Tests -----

describe('ViewDurationResults', () => {
  it('renders without crashing', () => {
    const { container } = render(<ViewDurationResults {...defaultProps} />);
    expect(container).not.toBeNull();
  });

  it('renders the card title', () => {
    render(<ViewDurationResults {...defaultProps} />);
    expect(screen.getByText('Summary of Session Duration Data')).not.toBeNull();
  });

  it('renders the card description', () => {
    render(<ViewDurationResults {...defaultProps} />);
    expect(screen.getByText('Key Presses are summarized in the table below')).not.toBeNull();
  });

  it('renders the Edit Keys Displayed button', () => {
    render(<ViewDurationResults {...defaultProps} />);
    expect(screen.getByText('Edit Keys Displayed')).not.toBeNull();
  });

  it('renders the CSV Download button', () => {
    render(<ViewDurationResults {...defaultProps} />);
    const downloads = screen.getAllByText('Download');
    expect(downloads.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the spreadsheet', () => {
    render(<ViewDurationResults {...defaultProps} />);
    expect(screen.getByTestId('spreadsheet')).not.toBeNull();
  });

  it('renders spreadsheet column labels from matrix[0]', () => {
    render(<ViewDurationResults {...defaultProps} />);
    expect(screen.getByText('Session')).not.toBeNull();
    expect(screen.getByText('Condition')).not.toBeNull();
  });

  it('renders the BackButton', () => {
    render(<ViewDurationResults {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Back' })).not.toBeNull();
  });

  describe('interactions', () => {
    beforeEach(() => {
      mockSetLocalCachedPrefs.mockReset();
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-duration');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('clicking the CSV Download button calls URL.createObjectURL', async () => {
      const user = userEvent.setup();
      render(<ViewDurationResults {...defaultProps} />);
      const downloadBtns = screen.getAllByRole('button', { name: /download/i });
      await user.click(downloadBtns[0]);
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('clicking the JSON Download button calls URL.createObjectURL', async () => {
      const user = userEvent.setup();
      render(<ViewDurationResults {...defaultProps} />);
      const downloadBtns = screen.getAllByRole('button', { name: /download/i });
      await user.click(downloadBtns[1]);
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('clicking Edit Keys Displayed opens the dropdown', async () => {
      const user = userEvent.setup();
      render(<ViewDurationResults {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /edit keys displayed/i }));
      expect(screen.getByRole('menuitemcheckbox', { name: 'Crying' })).not.toBeNull();
    });

    it('unchecking a key in Edit Keys Displayed calls setLocalCachedPrefs', async () => {
      const user = userEvent.setup();
      render(<ViewDurationResults {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /edit keys displayed/i }));
      await user.click(screen.getByRole('menuitemcheckbox', { name: 'Crying' }));
      expect(mockSetLocalCachedPrefs).toHaveBeenCalled();
    });
  });
});
