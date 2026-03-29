import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

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

vi.mock('@/lib/local_storage', () => ({
  setLocalCachedPrefs: vi.fn(),
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
});
