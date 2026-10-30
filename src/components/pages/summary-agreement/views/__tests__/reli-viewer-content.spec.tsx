// @ts-nocheck

import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';

const mockPrepareFrequencyReliTable = vi.hoisted(() =>
  vi.fn(() => ({
    rows: [[{ value: '50%' }]],
    headings: ['Key', 'IOA'],
  })),
);

const mockPrepareDurationReliTable = vi.hoisted(() =>
  vi.fn(() => ({
    rows: [[{ value: '75%' }]],
    headings: ['Key', 'Duration IOA'],
  })),
);

// ----- Module mocks -----

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
    setDefaultOptions: vi.fn(),
  },
}));

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ history: { go: vi.fn() } }),
  Link: ({ children }) => <a>{children}</a>,
}));

vi.mock('@tanstack/react-hotkeys', () => ({
  useHotkey: vi.fn(),
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => null,
}));

vi.mock('@/lib/reli', () => ({
  prepareFrequencyReliTable: mockPrepareFrequencyReliTable,
  prepareDurationReliTable: mockPrepareDurationReliTable,
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

  it('renders without crashing', async () => {
    const { container } = await render(<ReliabilityViewerContent {...defaultProps} />);
    expect(container).not.toBeNull();
  });

  it('renders the Frequency reliability card title', async () => {
    await render(<ReliabilityViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Reliability Estimates: Frequency')).toBeInTheDocument();
  });

  it('renders the Duration reliability card title', async () => {
    await render(<ReliabilityViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Reliability Estimates: Duration')).toBeInTheDocument();
  });

  it('renders the frequency card description', async () => {
    await render(<ReliabilityViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Reliability Estimates: Frequency')).toBeInTheDocument();
    const descs = await page.getByText('Estimates of various indices are presented below in 10s bins').all();
    expect(descs).toHaveLength(2);
  });

  it('renders two tables', async () => {
    await render(<ReliabilityViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Reliability Estimates: Frequency')).toBeInTheDocument();
    const tables = await page.getByRole('table').all();
    expect(tables).toHaveLength(2);
  });

  it('renders both reliability sections', async () => {
    await render(<ReliabilityViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Reliability Estimates: Frequency')).toBeInTheDocument();
    await expect.element(page.getByText('Reliability Estimates: Duration')).toBeInTheDocument();
  });

  it('frequency table shows column labels', async () => {
    await render(<ReliabilityViewerContent {...defaultProps} />);
    await expect.element(page.getByText('IOA', { exact: true }).first()).toBeInTheDocument();
  });

  it('duration table shows column labels', async () => {
    await render(<ReliabilityViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Duration IOA')).toBeInTheDocument();
  });

  it('calls reliability table preparation helpers with paired data and keyset', async () => {
    await render(<ReliabilityViewerContent {...defaultProps} />);

    expect(mockPrepareFrequencyReliTable).toHaveBeenCalledWith(defaultProps.Paired, defaultProps.Keyset);
    expect(mockPrepareDurationReliTable).toHaveBeenCalledWith(defaultProps.Paired, defaultProps.Keyset);
  });
});
