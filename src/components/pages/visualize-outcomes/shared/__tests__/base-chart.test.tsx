import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ----- Recharts mock -----

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children, className, ref }: any) => (
    <div data-testid="recharts-container" className={className} ref={ref}>
      {children}
    </div>
  ),
  ComposedChart: ({ children }: any) => <div data-testid="recharts-chart">{children}</div>,
  Line: () => null,
  Scatter: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ZAxis: () => null,
  Label: () => null,
}));

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

  it('renders the recharts container', () => {
    render(<BaseChart {...defaultProps} />);
    expect(screen.getByTestId('recharts-container')).not.toBeNull();
  });

  it('renders the chart title', () => {
    render(<BaseChart {...defaultProps} />);
    expect(screen.getByText('Test Chart Title')).not.toBeNull();
  });

  it('applies text-xl class on the chart container for large figureTextSize', () => {
    render(<BaseChart {...defaultProps} figureTextSize="large" />);
    const chartContainer = screen.getByTestId('recharts-container');
    expect(chartContainer.classList.contains('text-xl')).toBe(true);
  });

  it('applies text-2xl class on the chart container for extraLarge figureTextSize', () => {
    render(<BaseChart {...defaultProps} figureTextSize="extraLarge" />);
    const chartContainer = screen.getByTestId('recharts-container');
    expect(chartContainer.classList.contains('text-2xl')).toBe(true);
  });

  it('does not apply text-xl or text-2xl on the chart container for base figureTextSize', () => {
    render(<BaseChart {...defaultProps} figureTextSize="base" />);
    const chartContainer = screen.getByTestId('recharts-container');
    expect(chartContainer.classList.contains('text-xl')).toBe(false);
    expect(chartContainer.classList.contains('text-2xl')).toBe(false);
  });

  it('renders with multiple visible keys without throwing', () => {
    render(
      <BaseChart
        {...defaultProps}
        keySetFull={[
          { KeyDescription: 'Kicking', Visible: true },
          { KeyDescription: 'Hitting', Visible: true },
        ]}
      />,
    );
    expect(screen.getByTestId('recharts-container')).not.toBeNull();
  });

  it('does not render content for invisible keys (no crash)', () => {
    render(<BaseChart {...defaultProps} keySetFull={[{ KeyDescription: 'Hidden', Visible: false }]} />);
    expect(screen.getByTestId('recharts-container')).not.toBeNull();
  });

  it('renders with connectSpans=true without throwing', () => {
    render(<BaseChart {...defaultProps} connectSpans={true} />);
    expect(screen.getByTestId('recharts-container')).not.toBeNull();
  });

  it('renders the recharts composed chart', () => {
    render(<BaseChart {...defaultProps} />);
    expect(screen.getByTestId('recharts-chart')).not.toBeNull();
  });
});
