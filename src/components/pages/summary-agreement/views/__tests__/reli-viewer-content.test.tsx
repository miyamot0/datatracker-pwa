import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// ----- Module mocks -----

vi.mock('react-spreadsheet', () => ({
  default: ({ data, columnLabels }: { data: unknown[][]; columnLabels: string[] }) => (
    <div data-testid="spreadsheet">
      {columnLabels?.map((label, i) => (
        <span key={i}>{label}</span>
      ))}
      <span data-testid="row-count">{data.length}</span>
    </div>
  ),
}));

vi.mock('@/lib/reli', () => ({
  prepareFrequencyReliTable: vi.fn(() => ({
    rows: [[{ value: '50%' }]],
    headings: ['Key', 'IOA'],
  })),
  prepareDurationReliTable: vi.fn(() => ({
    rows: [[{ value: '75%' }]],
    headings: ['Key', 'Duration IOA'],
  })),
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button>Back</button>,
}));

// ----- Import under test -----

import ReliabilityViewerContent from '../reli-viewer-content';

// ----- Helpers -----

const makePaired = () => [] as any[];
const makeKeyset = () =>
  ({
    id: 'ks1',
    Name: 'TestSet',
    FrequencyKeys: [],
    DurationKeys: [],
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
  }) as any;

// ----- Tests -----

describe('ReliabilityViewerContent', () => {
  const defaultProps = {
    Group: 'GroupA',
    Individual: 'ClientB',
    Paired: makePaired(),
    Keyset: makeKeyset(),
  };

  it('renders without crashing', () => {
    const { container } = render(<ReliabilityViewerContent {...defaultProps} />);
    expect(container).not.toBeNull();
  });

  it('renders the Frequency reliability card title', () => {
    render(<ReliabilityViewerContent {...defaultProps} />);
    expect(screen.getByText('Reliability Estimates: Frequency')).not.toBeNull();
  });

  it('renders the Duration reliability card title', () => {
    render(<ReliabilityViewerContent {...defaultProps} />);
    expect(screen.getByText('Reliability Estimates: Duration')).not.toBeNull();
  });

  it('renders the frequency card description', () => {
    render(<ReliabilityViewerContent {...defaultProps} />);
    const descs = screen.getAllByText('Estimates of various indices are presented below in 10s bins');
    expect(descs.length).toBe(2);
  });

  it('renders two spreadsheets', () => {
    render(<ReliabilityViewerContent {...defaultProps} />);
    expect(screen.getAllByTestId('spreadsheet').length).toBe(2);
  });

  it('renders two BackButtons', () => {
    render(<ReliabilityViewerContent {...defaultProps} />);
    expect(screen.getAllByRole('button', { name: 'Back' }).length).toBe(2);
  });

  it('frequency spreadsheet shows column labels', () => {
    render(<ReliabilityViewerContent {...defaultProps} />);
    expect(screen.getByText('IOA')).not.toBeNull();
  });

  it('duration spreadsheet shows column labels', () => {
    render(<ReliabilityViewerContent {...defaultProps} />);
    expect(screen.getByText('Duration IOA')).not.toBeNull();
  });
});
