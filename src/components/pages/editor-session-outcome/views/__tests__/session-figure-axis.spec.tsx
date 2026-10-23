import { render } from 'vitest-browser-react';
import { vi, describe, it, expect } from 'vitest';

import SessionFigure from '../session-figure';

const makeSession = (timerMain: number) =>
  ({
    SystemKeyPresses: [],
    FrequencyKeyPresses: [],
    DurationKeyPresses: [],
    TimerMain: timerMain,
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
  }) as any;

const keysVisible = [
  { KeyDescription: 'Hitting', Visible: true },
  { KeyDescription: 'Kicking', Visible: true },
] as any;

describe('SessionFigure x-axis span', () => {
  it('runs the x-axis span from the first tick to the last tick, which is the domain end', async () => {
    await render(
      <SessionFigure
        Session={makeSession(12.4)}
        PlotData={[
          { second: 0, Hitting: 0, Kicking: 0 },
          { second: 3, Hitting: 1, Kicking: 0 },
          { second: 12, Hitting: 1, Kicking: 2 },
        ]}
        KeysHidden={keysVisible}
      />,
    );

    await vi.waitFor(() => expect(document.querySelectorAll('.axis-span-line-x').length).toBe(1));

    const tickLines = Array.from(document.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick-line'));
    const tickXs = tickLines.map((el) => el.getBoundingClientRect().left);
    const tickLabels = Array.from(
      document.querySelectorAll('.recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value'),
    ).map((el) => el.textContent);
    const line = document.querySelector('.axis-span-line-x')!.getBoundingClientRect();

    expect(tickLabels[0]).toBe('0');
    expect(tickLabels[tickLabels.length - 1]).toBe('13');
    expect(Math.abs(line.left - Math.min(...tickXs))).toBeLessThan(1);
    expect(Math.abs(line.right - Math.max(...tickXs))).toBeLessThan(1);
  });
});
