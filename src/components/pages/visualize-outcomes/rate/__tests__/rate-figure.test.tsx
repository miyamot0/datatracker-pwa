import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ----- Hoisted mocks -----

const mockGetDivPng = vi.hoisted(() => vi.fn());
const mockDivRef = vi.hoisted(() => ({ current: null }));
const mockNavigate = vi.hoisted(() => vi.fn());

// ----- Module mocks -----

vi.mock('@/components/pages/visualize-outcomes/shared/base-chart', () => ({
  BaseChart: ({ title, figureTextSize, connectSpans }: any) => (
    <div data-testid="base-chart">
      <span data-testid="chart-title">{title}</span>
      <span data-testid="chart-text-size">{figureTextSize}</span>
      <span data-testid="chart-connect">{String(connectSpans)}</span>
    </div>
  ),
}));

vi.mock('recharts-to-png', () => ({
  useGenerateImage: () => [mockGetDivPng, { ref: mockDivRef }],
}));

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => mockNavigate,
}));

vi.mock('@/lib/graphing', () => ({
  generateTicks: () => [],
  createChartLegends: () => [],
  createNavigationHandler: () => vi.fn(),
  prepareRateDataUniversal: () => ({ preparedData: [] }),
}));

vi.mock('@/lib/calculations', () => ({
  processMultipleSessionDataWithKeys: () => [],
}));

vi.mock('@/lib/calculations/calculation-helpers', () => ({
  convertLegacyTimerType: () => 'End on Main Timer',
}));

// ----- Imports under test -----

import RateFigureVisualization from '../rate-figure';

// ----- Helpers -----

const defaultProps = {
  Group: 'Group1',
  Individual: 'Client1',
  Evaluation: 'Eval1',
  FilteredSessions: [],
  ScheduleOption: 'End on Main Timer' as any,
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
  KeySetFull: [{ KeyDescription: 'Kicking', Visible: true }],
  FigureTextSize: 'base' as const,
  ConnectSpans: false,
  MinX: 1,
  MaxX: 10,
};

// ----- Tests -----

describe('RateFigureVisualization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the BaseChart component', () => {
    render(<RateFigureVisualization {...defaultProps} />);
    expect(screen.getByTestId('base-chart')).not.toBeNull();
  });

  it('passes correct title to BaseChart', () => {
    render(<RateFigureVisualization {...defaultProps} />);
    expect(screen.getByTestId('chart-title').textContent).toBe('Visualization of Data as Rates');
  });

  it('passes FigureTextSize to BaseChart', () => {
    render(<RateFigureVisualization {...defaultProps} FigureTextSize="large" />);
    expect(screen.getByTestId('chart-text-size').textContent).toBe('large');
  });

  it('passes ConnectSpans=true to BaseChart', () => {
    render(<RateFigureVisualization {...defaultProps} ConnectSpans={true} />);
    expect(screen.getByTestId('chart-connect').textContent).toBe('true');
  });

  it('passes ConnectSpans=false to BaseChart', () => {
    render(<RateFigureVisualization {...defaultProps} ConnectSpans={false} />);
    expect(screen.getByTestId('chart-connect').textContent).toBe('false');
  });

  it('renders the Download button', () => {
    render(<RateFigureVisualization {...defaultProps} />);
    expect(screen.getByText('Download Figure as PNG')).not.toBeNull();
  });
});
