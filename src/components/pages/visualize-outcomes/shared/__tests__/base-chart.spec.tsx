import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ----- Graphing / helpers mocks -----

vi.mock('@/lib/graphing', () => ({
  getChartConfiguration: () => ({
    noAnimationProps: {},
    chartMargins: { top: 30, right: 20, bottom: 30, left: 20 },
    xAxisConfig: {},
    yAxisStyle: {},
    labelStyle: {},
  }),
  getUniqueSessionConditions: (_sessions: any) => ['Baseline'],
  calculateSplitPoints: () => [],
}));

vi.mock('@/lib/arrays', () => ({
  splitAtPoints: (data: any) => [data],
}));

vi.mock('@/lib/colors', () => ({
  FIGURE_PATH_COLORS: ['#ff0000', '#00ff00', '#0000ff'],
}));

vi.mock('@/lib/shapes', () => ({
  getShape: () => 'circle',
}));

// ----- Imports under test -----

import { BaseChart } from '../base-chart';

// ----- Helpers -----

const mockTooltip = () => <div data-testid="custom-tooltip" />;

const defaultProps = {
  title: 'Test Chart Title',
  preparedData: [{ session: 1, Condition: 'Baseline', Kicking: 50 }],
  filteredSessions: [{ Condition: 'Baseline' } as any],
  keySetFull: [{ KeyDescription: 'Kicking', Visible: true }],
  figureTextSize: 'base' as const,
  connectSpans: false,
  minX: 1,
  maxX: 5,
  xTicks: [1, 2, 3, 4, 5],
  legends: [],
  yAxisConfig: { min: 0, max: 100, domain: [0, 100] as [number, number], label: 'Percentage' },
  customTooltip: mockTooltip,
  onNavigate: vi.fn(),
  divRef: { current: null } as React.RefObject<HTMLDivElement>,
};

// ----- Tests -----

describe('BaseChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the recharts container', async () => {
    await render(<BaseChart {...defaultProps} />);
    await expect.element(page.getByText('Test Chart Title')).toBeInTheDocument();
  });

  it('renders the chart title', async () => {
    await render(<BaseChart {...defaultProps} />);
    await expect.element(page.getByText('Test Chart Title')).toBeInTheDocument();
  });

  it('applies text-xl class on the chart container for large figureTextSize', async () => {
    await render(<BaseChart {...defaultProps} figureTextSize="large" />);
    const container = document.querySelector('.recharts-responsive-container');
    expect(container).not.toBeNull();
    expect(container?.classList.contains('text-xl')).toBe(true);
  });

  it('applies text-2xl class on the chart container for extraLarge figureTextSize', async () => {
    await render(<BaseChart {...defaultProps} figureTextSize="extraLarge" />);
    const container = document.querySelector('.recharts-responsive-container');
    expect(container).not.toBeNull();
    expect(container?.classList.contains('text-2xl')).toBe(true);
  });

  it('does not apply text-xl or text-2xl on the chart container for base figureTextSize', async () => {
    await render(<BaseChart {...defaultProps} figureTextSize="base" />);
    const container = document.querySelector('.recharts-responsive-container');
    expect(container).not.toBeNull();
    expect(container?.classList.contains('text-xl')).toBe(false);
    expect(container?.classList.contains('text-2xl')).toBe(false);
  });

  it('renders with multiple visible keys without throwing', async () => {
    await render(
      <BaseChart
        {...defaultProps}
        keySetFull={[
          { KeyDescription: 'Kicking', Visible: true },
          { KeyDescription: 'Hitting', Visible: true },
        ]}
      />,
    );
    await expect.element(page.getByText('Test Chart Title')).toBeInTheDocument();
  });

  it('does not render content for invisible keys (no crash)', async () => {
    await render(<BaseChart {...defaultProps} keySetFull={[{ KeyDescription: 'Hidden', Visible: false }]} />);
    await expect.element(page.getByText('Test Chart Title')).toBeInTheDocument();
  });

  it('renders with connectSpans=true without throwing', async () => {
    await render(<BaseChart {...defaultProps} connectSpans={true} />);
    await expect.element(page.getByText('Test Chart Title')).toBeInTheDocument();
  });

  it('renders the recharts composed chart', async () => {
    await render(<BaseChart {...defaultProps} />);
    const container = document.querySelector('.recharts-responsive-container');
    expect(container).not.toBeNull();
  });
});

