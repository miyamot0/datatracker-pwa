import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';
import { vi, describe, it, expect } from 'vitest';

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
      <SessionFigure Session={makeSession()} PlotData={[{ second: 1, Hitting: 1 }]} KeysHidden={defaultKeysHidden} />,
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
});
