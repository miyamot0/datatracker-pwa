import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ----- Hoisted mocks -----

const mockSetLocalCachedPrefs = vi.hoisted(() => vi.fn());

// ----- Module mocks -----

vi.mock('@/components/pages/visualize-outcomes/proportion/proportion-figure', () => ({
  default: ({ FigureTextSize, ConnectSpans, KeySetFull }: any) => (
    <div data-testid="proportion-figure">
      <span data-testid="figure-text-size">{FigureTextSize}</span>
      <span data-testid="figure-connect">{String(ConnectSpans)}</span>
      <span data-testid="figure-key-count">{KeySetFull.length}</span>
    </div>
  ),
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button data-testid="back-button">Back</button>,
}));

vi.mock('@/lib/local_storage', () => ({
  setLocalCachedPrefs: mockSetLocalCachedPrefs,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({ to, children, params }: any) => {
    const href = params
      ? String(to)
          .replace('$group', params.group ?? '')
          .replace('$individual', params.individual ?? '')
          .replace('$evaluation', params.evaluation ?? '')
      : String(to);
    return <a href={href}>{children}</a>;
  },
  useNavigate: () => vi.fn(),
}));

vi.mock('@/types/schedules', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/types/schedules')>()),
  filteredSessionScoringOptions: () => [{ value: 'End on Timer #1', label: 'Score Timer #1 Time' }],
}));

// ----- Imports under test -----

import ResultsProportionVisualsPage from '../results-proportion-visuals-page';

// ----- Helpers -----

const makeKey = (desc: string, visible = true) => ({
  KeyName: 'k',
  KeyDescription: desc,
  KeyCode: 65,
  KeyType: 'Observed' as const,
  Visible: visible,
});

const defaultProps = {
  Group: 'Group1',
  Individual: 'Client1',
  Evaluation: 'Eval1',
  Results: [],
  DynamicKeySet: {
    id: 'ks1',
    Name: 'KS1',
    FrequencyKeys: [],
    DurationKeys: [],
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
    createdAt: new Date(),
  } as any,
  TimerMapping: { value: 'End on Timer #1', label: 'Score Timer #1 Time' },
  ShowKeys: [makeKey('Kicking'), makeKey('Hitting')],
  ResultsFiltered: [],
  MinX: 1,
  MaxX: 5,
  Settings: { TimerTwoDisplay: 'hide', TimerThreeDisplay: 'hide' } as any,
};

// ----- Tests -----

describe('ResultsProportionVisualsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the card title', () => {
    render(<ResultsProportionVisualsPage {...defaultProps} />);
    expect(screen.getByText('Visualization of Behavioral Rates')).not.toBeNull();
  });

  it('renders the card description', () => {
    render(<ResultsProportionVisualsPage {...defaultProps} />);
    expect(screen.getByText('Options for Visualizing Data Provided Below')).not.toBeNull();
  });

  it('renders the See Rate link', () => {
    render(<ResultsProportionVisualsPage {...defaultProps} />);
    const link = screen.getByText('See Rate').closest('a');
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toContain('rate');
  });

  it('renders the back button', () => {
    render(<ResultsProportionVisualsPage {...defaultProps} />);
    expect(screen.getByTestId('back-button')).not.toBeNull();
  });

  it('renders the Edit Keys Displayed dropdown trigger', () => {
    render(<ResultsProportionVisualsPage {...defaultProps} />);
    expect(screen.getByText('Edit Keys Displayed')).not.toBeNull();
  });

  it('renders Select Timer to Reference label', () => {
    render(<ResultsProportionVisualsPage {...defaultProps} />);
    expect(screen.getByText(/Select Timer to Reference/)).not.toBeNull();
  });

  it('renders Element Magnification label', () => {
    render(<ResultsProportionVisualsPage {...defaultProps} />);
    expect(screen.getByText(/Element Magnification/)).not.toBeNull();
  });

  it('renders Connect All Spans switch label', () => {
    render(<ResultsProportionVisualsPage {...defaultProps} />);
    expect(screen.getByText(/Connect All Spans/)).not.toBeNull();
  });

  it('renders the proportion of session time description', () => {
    render(<ResultsProportionVisualsPage {...defaultProps} />);
    expect(screen.getByText(/proportion of session time/)).not.toBeNull();
  });

  it('renders the ProportionFigureVisualization when DynamicKeySet is truthy', () => {
    render(<ResultsProportionVisualsPage {...defaultProps} />);
    expect(screen.getByTestId('proportion-figure')).not.toBeNull();
  });

  it('passes ShowKeys length to the figure component', () => {
    render(<ResultsProportionVisualsPage {...defaultProps} />);
    expect(screen.getByTestId('figure-key-count').textContent).toBe('2');
  });

  it('initially passes ConnectSpans=false to the figure', () => {
    render(<ResultsProportionVisualsPage {...defaultProps} />);
    expect(screen.getByTestId('figure-connect').textContent).toBe('false');
  });

  it('initially passes figureTextSize=base to the figure', () => {
    render(<ResultsProportionVisualsPage {...defaultProps} />);
    expect(screen.getByTestId('figure-text-size').textContent).toBe('base');
  });
});
