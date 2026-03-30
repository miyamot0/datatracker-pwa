import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  ReferenceLine: ({ x, stroke, label }: any) => (
    <div data-testid="reference-line" data-x={String(x)} data-stroke={stroke}>
      {label}
    </div>
  ),
  Label: ({ value }: any) => <span data-testid="chart-label">{value}</span>,
  Line: ({ dataKey, name, stroke }: any) => (
    <div data-testid="line" data-key={String(dataKey)} data-name={String(name)} data-stroke={stroke} />
  ),
  Scatter: ({ dataKey, shape, fill }: any) => (
    <div data-testid="scatter" data-key={String(dataKey)} data-shape={String(shape)} data-fill={fill} />
  ),
  XAxis: ({ children, domain }: any) => (
    <div data-testid="x-axis" data-domain={JSON.stringify(domain)}>
      {children}
    </div>
  ),
  YAxis: ({ children, max, ticks }: any) => (
    <div data-testid="y-axis" data-max={String(max)} data-ticks={JSON.stringify(ticks)}>
      {children}
    </div>
  ),
  Tooltip: ({ content }: any) => {
    const samplePayload = [
      {
        payload: { Condition: 'Baseline', second: 10 },
        name: 'Baseline-Hitting',
        dataKey: 'Baseline-Hitting',
        value: 2,
      },
      {
        payload: { Condition: 'Baseline', second: 10 },
        name: 'Baseline-Hitting-Points_',
        dataKey: 'Baseline-Hitting-Points_',
        value: 2,
      },
      {
        payload: { Condition: 'Baseline', second: 10 },
        name: 'Baseline-Kicking',
        dataKey: 'Baseline-Kicking',
        value: Number.NaN,
      },
      {
        payload: { Condition: 'Other', second: 10 },
        name: 'Other-Hitting',
        dataKey: 'Other-Hitting',
        value: 4,
      },
      {
        payload: { Condition: 'Baseline', second: 10 },
        name: 'Baseline-Hitting',
        dataKey: 'Baseline-Hitting',
        value: 2,
      },
    ];

    const inactive = content?.type?.({ active: false, payload: [] });
    const active = content?.type?.({ active: true, payload: samplePayload });

    return (
      <div data-testid="tooltip-wrapper">
        {inactive}
        {active}
      </div>
    );
  },
  Legend: ({ payload }: any) => (
    <div data-testid="legend">
      {payload?.map((item: any, i: number) => (
        <span key={i}>{item.value}</span>
      ))}
    </div>
  ),
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

import SessionFigure from '../session-figure';

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
    SystemKeyPresses: [
      { TimeIntoSession: 5, KeyScheduleRecording: 'Secondary' },
      { TimeIntoSession: 15, KeyScheduleRecording: 'Secondary' },
      { TimeIntoSession: 10, KeyScheduleRecording: 'Tertiary' },
      { TimeIntoSession: 20, KeyScheduleRecording: 'Tertiary' },
    ],
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
      FrequencyKeys: [
        { KeyName: 'a', KeyDescription: 'Hitting', KeyCode: 65 },
        { KeyName: 'b', KeyDescription: 'Kicking', KeyCode: 66 },
      ],
      DurationKeys: [],
      DerivedKeys: [],
      SpecialDurationKeys: [],
      ScorableDurationKeys: [],
      createdAt: new Date(),
    },
    Comments: 'Test comment',
    ...overrides,
  }) as any;

const defaultKeysHidden = [
  { KeyDescription: 'Hitting', Visible: true },
  { KeyDescription: 'Kicking', Visible: false },
];

describe('SessionFigure', () => {
  it('renders nothing when Session is undefined', async () => {
    const { container } = await render(
      <SessionFigure Session={undefined} PlotData={[]} KeysHidden={defaultKeysHidden} />,
    );
    expect(container.innerHTML.trim()).toBe('');
  });

  it('renders nothing when PlotData is undefined', async () => {
    const { container } = await render(
      <SessionFigure Session={makeSession()} PlotData={undefined} KeysHidden={defaultKeysHidden} />,
    );
    expect(container.innerHTML.trim()).toBe('');
  });

  it('renders the recharts container when Session and PlotData are provided', async () => {
    await render(
      <SessionFigure
        Session={makeSession()}
        PlotData={[{ second: 1, Hitting: 1, Kicking: 5 }]}
        KeysHidden={defaultKeysHidden}
      />,
    );
    await expect.element(page.getByText('Within-session Visualization of Session Data')).toBeInTheDocument();
  });

  it('renders the chart title text', async () => {
    await render(<SessionFigure Session={makeSession()} PlotData={[]} KeysHidden={defaultKeysHidden} />);
    await expect.element(page.getByText('Within-session Visualization of Session Data')).toBeInTheDocument();
  });

  it('renders with empty PlotData without crashing', async () => {
    const { container } = await render(
      <SessionFigure Session={makeSession()} PlotData={[]} KeysHidden={defaultKeysHidden} />,
    );
    expect(container).not.toBeNull();
  });

  it('renders with hidden keys without crashing', async () => {
    const { container } = await render(
      <SessionFigure
        Session={makeSession()}
        PlotData={[{ second: 1, Hitting: 1 }]}
        KeysHidden={[{ KeyDescription: 'Hitting', Visible: false }]}
      />,
    );
    expect(container).not.toBeNull();
  });

  it('renders reference lines and alternating timer labels for secondary and tertiary schedules', async () => {
    await render(
      <SessionFigure
        Session={makeSession()}
        PlotData={[{ second: 1, Hitting: 1, Kicking: 2 }]}
        KeysHidden={defaultKeysHidden}
      />,
    );

    const refLines = await page.getByTestId('reference-line').all();
    expect(refLines.length).toBe(4);
    await expect.element(page.getByText('Timer #2')).toBeInTheDocument();
    await expect.element(page.getByText('Timer #3')).toBeInTheDocument();
  });

  it('filters hidden key paths from lines, scatter points, and legend payload', async () => {
    await render(
      <SessionFigure
        Session={makeSession()}
        PlotData={[{ second: 1, Hitting: 1, Kicking: 9 }]}
        KeysHidden={defaultKeysHidden}
      />,
    );

    await expect.element(page.getByTestId('legend').getByText('Hitting')).toBeInTheDocument();
    expect(await page.getByText('Kicking').query()).toBeNull();

    const lines = await page.getByTestId('line').all();
    expect(lines.length).toBe(1);
    await expect.element(lines[0]).toHaveAttribute('data-key', 'Hitting');
  });

  it('renders tooltip content only for unique, non-NaN, matching condition payload entries', async () => {
    await render(
      <SessionFigure
        Session={makeSession()}
        PlotData={[{ second: 10, Hitting: 2, Kicking: 3 }]}
        KeysHidden={defaultKeysHidden}
      />,
    );

    await expect.element(page.getByText('Time into Session: 10s')).toBeInTheDocument();
    await expect.element(page.getByTestId('tooltip-wrapper').getByText('Hitting')).toBeInTheDocument();
    await expect.element(page.getByText('2 Instances')).toBeInTheDocument();
    expect(await page.getByText('NaN Instances').query()).toBeNull();
  });

  it('uses computed ticks and max values for y-axis and timer-domain on x-axis', async () => {
    await render(
      <SessionFigure
        Session={makeSession({ TimerMain: 30 })}
        PlotData={[{ second: 1, Hitting: 1, Kicking: 2 }]}
        KeysHidden={defaultKeysHidden}
      />,
    );

    const yAxis = page.getByTestId('y-axis');
    await expect.element(yAxis).toHaveAttribute('data-max', '2');
    await expect.element(yAxis).toHaveAttribute('data-ticks', '[0,1,2,3,2]');

    const xAxis = page.getByTestId('x-axis');
    await expect.element(xAxis).toHaveAttribute('data-domain', '[0,31]');
  });
});
