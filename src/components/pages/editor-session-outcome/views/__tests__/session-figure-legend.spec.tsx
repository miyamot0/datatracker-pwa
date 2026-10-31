import { render } from 'vitest-browser-react';
import { vi, describe, it, expect } from 'vitest';

import SessionFigure from '../session-figure';

vi.mock('@/components/pages/visualize-outcomes/shared/annotations/axis-span-lines', () => ({
  AxisSpanLines: () => null,
}));

const session = {
  SessionSettings: { Condition: 'Baseline', Session: 1, DurationS: 600 },
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
} as any;

const keysHidden = [
  { KeyDescription: 'Hitting', Visible: true },
  { KeyDescription: 'Kicking', Visible: true },
];

describe('SessionFigure legend', () => {
  it('matches the chart legend: outlined condition entry first, then solid black key shapes', async () => {
    await render(
      <SessionFigure Session={session} PlotData={[{ second: 1, Hitting: 1, Kicking: 2 }]} KeysHidden={keysHidden} />,
    );
    await vi.waitFor(() => expect(document.querySelectorAll('.recharts-legend-item').length).toBe(3));

    const [condition, ...keys] = Array.from(document.querySelectorAll('.recharts-legend-item'));

    expect(condition.querySelector('.recharts-legend-item-text')!.textContent).toBe('Baseline');
    const conditionMarker = condition.querySelector('svg path')!;
    expect(getComputedStyle(conditionMarker).stroke).toBe('rgb(0, 0, 0)');
    expect(getComputedStyle(conditionMarker).strokeWidth).toBe('4px');

    expect(keys.map((item) => item.querySelector('.recharts-legend-item-text')!.textContent)).toEqual([
      'Hitting',
      'Kicking',
    ]);
    for (const item of keys) {
      expect(getComputedStyle(item.querySelector('svg path')!).fill).toBe('rgb(0, 0, 0)');
    }
  });
});
