import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// ----- Hoisted mocks -----

const mockSetLocalCachedPrefs = vi.hoisted(() => vi.fn());

// ----- Module mocks -----

vi.mock('../rate-figure', () => ({
  default: ({ FigureTextSize, ConnectSpans, KeySetFull }: any) => (
    <div data-testid="rate-figure">
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

import ResultsRateVisualsPage from '../results-rate-visuals-page';

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
  Handle: {} as any,
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

describe('ResultsRateVisualsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the card title', () => {
    render(<ResultsRateVisualsPage {...defaultProps} />);
    expect(screen.getByText('Visualization of Behavioral Rates')).not.toBeNull();
  });

  it('renders the card description', () => {
    render(<ResultsRateVisualsPage {...defaultProps} />);
    expect(screen.getByText('Options for Visualizing Data Provided Below')).not.toBeNull();
  });

  it('renders the See Proportion link', () => {
    render(<ResultsRateVisualsPage {...defaultProps} />);
    const link = screen.getByText('See Proportion').closest('a');
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toContain('proportion');
  });

  it('renders the back button', () => {
    render(<ResultsRateVisualsPage {...defaultProps} />);
    expect(screen.getByTestId('back-button')).not.toBeNull();
  });

  it('renders the Edit Keys Displayed dropdown trigger', () => {
    render(<ResultsRateVisualsPage {...defaultProps} />);
    expect(screen.getByText('Edit Keys Displayed')).not.toBeNull();
  });

  it('renders Timer to Reference label', () => {
    render(<ResultsRateVisualsPage {...defaultProps} />);
    expect(screen.getByText(/Timer to Reference/)).not.toBeNull();
  });

  it('renders Element Magnification label', () => {
    render(<ResultsRateVisualsPage {...defaultProps} />);
    expect(screen.getByText(/Element Magnification/)).not.toBeNull();
  });

  it('renders Connect All Spans switch label', () => {
    render(<ResultsRateVisualsPage {...defaultProps} />);
    expect(screen.getByText(/Connect All Spans/)).not.toBeNull();
  });

  it('renders the rate description text', () => {
    render(<ResultsRateVisualsPage {...defaultProps} />);
    expect(screen.getByText(/rate/)).not.toBeNull();
  });

  it('renders the RateFigureVisualization when DynamicKeySet is truthy', () => {
    render(<ResultsRateVisualsPage {...defaultProps} />);
    expect(screen.getByTestId('rate-figure')).not.toBeNull();
  });

  it('passes ShowKeys length to the figure component', () => {
    render(<ResultsRateVisualsPage {...defaultProps} />);
    expect(screen.getByTestId('figure-key-count').textContent).toBe('2');
  });

  it('initially passes ConnectSpans=false to the figure', () => {
    render(<ResultsRateVisualsPage {...defaultProps} />);
    expect(screen.getByTestId('figure-connect').textContent).toBe('false');
  });

  it('initially passes figureTextSize=base to the figure', () => {
    render(<ResultsRateVisualsPage {...defaultProps} />);
    expect(screen.getByTestId('figure-text-size').textContent).toBe('base');
  });

  describe('interactions', () => {
    it('clicking the Connect All Spans switch toggles ConnectSpans to true', async () => {
      const user = userEvent.setup();
      render(<ResultsRateVisualsPage {...defaultProps} />);
      expect(screen.getByTestId('figure-connect').textContent).toBe('false');
      await user.click(screen.getByRole('switch'));
      expect(screen.getByTestId('figure-connect').textContent).toBe('true');
    });

    it('clicking Connect All Spans twice toggles back to false', async () => {
      const user = userEvent.setup();
      render(<ResultsRateVisualsPage {...defaultProps} />);
      await user.click(screen.getByRole('switch'));
      await user.click(screen.getByRole('switch'));
      expect(screen.getByTestId('figure-connect').textContent).toBe('false');
    });

    it('clicking Edit Keys Displayed opens dropdown with key checkboxes', async () => {
      const user = userEvent.setup();
      render(<ResultsRateVisualsPage {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /edit keys displayed/i }));
      expect(screen.getByRole('menuitemcheckbox', { name: 'Kicking' })).not.toBeNull();
      expect(screen.getByRole('menuitemcheckbox', { name: 'Hitting' })).not.toBeNull();
    });

    it('toggling a key in the dropdown calls setLocalCachedPrefs', async () => {
      const user = userEvent.setup();
      render(<ResultsRateVisualsPage {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /edit keys displayed/i }));
      await user.click(screen.getByRole('menuitemcheckbox', { name: 'Kicking' }));
      expect(mockSetLocalCachedPrefs).toHaveBeenCalled();
    });
  });
});
