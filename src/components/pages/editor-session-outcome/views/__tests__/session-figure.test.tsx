import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// ----- Recharts mock -----

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="recharts-container">{children}</div>,
  ComposedChart: ({ children }: any) => <div data-testid="recharts-chart">{children}</div>,
  Line: () => null,
  Scatter: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ZAxis: () => null,
  Label: () => null,
  ReferenceLine: () => null,
}));

vi.mock('@/lib/graphing', () => ({
  generateTicks: () => [0, 1, 2, 3],
}));

vi.mock('@/lib/colors', () => ({
  FIGURE_PATH_COLORS: ['#ff0000', '#00ff00'],
}));

vi.mock('@/lib/shapes', () => ({
  getShape: () => 'circle',
}));

// ----- Import under test -----

import SessionFigure from '../session-figure';

// ----- Helpers -----

const makeSession = (overrides = {}) =>
  ({
    SessionSettings: {
      Condition: 'Baseline',
      Session: 1,
      TimerOption: 'End on Timer #1',
      Initials: 'JD',
      Role: 'Primary',
      DurationS: 600,
      KeySet: 'TestSet',
      Therapist: 'Dr. Smith',
    },
    SystemKeyPresses: [],
    FrequencyKeyPresses: [],
    DurationKeyPresses: [],
    PlottedKeys: [],
    SessionStart: new Date().toISOString(),
    SessionEnd: new Date().toISOString(),
    EndedEarly: false,
    TimerMain: 60,
    TimerOne: 60,
    TimerTwo: 0,
    TimerThree: 0,
    Filename: 'test.json',
    MaxY: 5,
    YTicks: [0, 1, 2, 3, 4, 5],
    Keyset: {
      id: 'ks1',
      Name: 'TestSet',
      FrequencyKeys: [{ KeyName: 'a', KeyDescription: 'Hitting', KeyCode: 65 }],
      DurationKeys: [],
      DerivedKeys: [],
      SpecialDurationKeys: [],
      ScorableDurationKeys: [],
      createdAt: new Date(),
    },
    Comments: 'Test comment',
    ...overrides,
  }) as any;

const defaultKeysHidden = [{ KeyDescription: 'Hitting', Visible: true }];

// ----- Tests -----

describe('SessionFigure', () => {
  it('renders nothing when Session is undefined', () => {
    const { container } = render(<SessionFigure Session={undefined} PlotData={[]} KeysHidden={defaultKeysHidden} />);
    // renders empty fragment — no recharts-container
    expect(container.firstChild).toBeNull();
    expect(container.querySelector('[data-testid="recharts-container"]')).toBeNull();
  });

  it('renders nothing when PlotData is undefined', () => {
    const { container } = render(
      <SessionFigure Session={makeSession()} PlotData={undefined} KeysHidden={defaultKeysHidden} />,
    );
    expect(container.querySelector('[data-testid="recharts-container"]')).toBeNull();
  });

  it('renders the recharts container when Session and PlotData are provided', () => {
    render(
      <SessionFigure Session={makeSession()} PlotData={[{ second: 1, Hitting: 1 }]} KeysHidden={defaultKeysHidden} />,
    );
    expect(screen.getByTestId('recharts-container')).not.toBeNull();
  });

  it('renders the chart title text', () => {
    render(<SessionFigure Session={makeSession()} PlotData={[]} KeysHidden={defaultKeysHidden} />);
    expect(screen.getByText('Within-session Visualization of Session Data')).not.toBeNull();
  });

  it('renders with empty PlotData without crashing', () => {
    render(<SessionFigure Session={makeSession()} PlotData={[]} KeysHidden={defaultKeysHidden} />);
    expect(screen.getByTestId('recharts-container')).not.toBeNull();
  });

  it('renders with hidden keys without crashing', () => {
    render(
      <SessionFigure
        Session={makeSession()}
        PlotData={[{ second: 1, Hitting: 1 }]}
        KeysHidden={[{ KeyDescription: 'Hitting', Visible: false }]}
      />,
    );
    expect(screen.getByTestId('recharts-container')).not.toBeNull();
  });
});
