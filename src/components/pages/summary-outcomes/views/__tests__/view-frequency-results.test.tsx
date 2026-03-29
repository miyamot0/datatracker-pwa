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

import ViewFrequencyResults from '../view-frequency-results';

// ----- Helpers -----

const makeKeyset = () =>
  ({
    id: 'ks1',
    Name: 'TestSet',
    FrequencyKeys: [{ KeyName: 'A', KeyDescription: 'Hitting', KeyCode: 65 }],
    DurationKeys: [],
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
  }) as any;

const makeShowKeys = () => [{ KeyName: 'A', KeyDescription: 'Hitting', Visible: true }] as any[];

const defaultProps = {
  SessionTimer: 'End on Timer #1' as any,
  Results: [],
  LatestKeyset: makeKeyset(),
  ShowKeysFreq: makeShowKeys(),
  Group: 'GroupA',
  Individual: 'ClientB',
  Evaluation: 'Eval1',
};

// ----- Tests -----

describe('ViewFrequencyResults', () => {
  it('renders without crashing', () => {
    const { container } = render(<ViewFrequencyResults {...defaultProps} />);
    expect(container).not.toBeNull();
  });

  it('renders the card title', () => {
    render(<ViewFrequencyResults {...defaultProps} />);
    expect(screen.getByText('Summary of Session Frequency Data')).not.toBeNull();
  });

  it('renders the card description', () => {
    render(<ViewFrequencyResults {...defaultProps} />);
    expect(screen.getByText('Key Presses are summarized in the table below')).not.toBeNull();
  });

  it('renders the Edit Keys Displayed button', () => {
    render(<ViewFrequencyResults {...defaultProps} />);
    expect(screen.getByText('Edit Keys Displayed')).not.toBeNull();
  });

  it('renders CSV and JSON Download buttons', () => {
    render(<ViewFrequencyResults {...defaultProps} />);
    const downloads = screen.getAllByText('Download');
    expect(downloads.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the spreadsheet', () => {
    render(<ViewFrequencyResults {...defaultProps} />);
    expect(screen.getByTestId('spreadsheet')).not.toBeNull();
  });

  it('renders spreadsheet column labels from matrix[0]', () => {
    render(<ViewFrequencyResults {...defaultProps} />);
    expect(screen.getByText('Session')).not.toBeNull();
    expect(screen.getByText('Condition')).not.toBeNull();
  });

  it('renders the BackButton', () => {
    render(<ViewFrequencyResults {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Back' })).not.toBeNull();
  });
});
