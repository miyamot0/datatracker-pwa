import { render } from 'vitest-browser-react';
import { vi, describe, it, expect } from 'vitest';
import { LineChart, Line, XAxis, YAxis, useXAxisScale } from 'recharts';

import { AimLinesLayer } from '../aim-lines-layer';
import { AxisSpanLines } from '../axis-span-lines';
import type { AimLine } from '@/lib/graphing/series-style';

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();

  return { ...actual, useXAxisScale: vi.fn(actual.useXAxisScale) };
});

const aimLines: AimLine[] = [{ x1: 1, x2: 5, y: 4, lineType: 'solid', color: '#000000', page: 'rate' }];
const data = [
  { x: 0, y: 0 },
  { x: 10, y: 10 },
];

describe('AimLinesLayer outside a chart', () => {
  it('renders nothing when no axis scales or plot area are available', async () => {
    const screen = await render(
      <svg width={400} height={300}>
        <AimLinesLayer aimLines={aimLines} />
      </svg>,
    );

    expect(screen.container.querySelectorAll('line').length).toBe(0);
  });
});

describe('AimLinesLayer with an x scale that cannot place a value', () => {
  it('skips aim lines whose pixel positions are undefined', async () => {
    vi.mocked(useXAxisScale).mockReturnValue((() => undefined) as unknown as ReturnType<typeof useXAxisScale>);

    const screen = await render(
      <LineChart width={400} height={300} data={data}>
        <XAxis dataKey="x" type="number" domain={[0, 10]} />
        <YAxis domain={[0, 10]} />
        <Line dataKey="y" isAnimationActive={false} />
        <AimLinesLayer aimLines={aimLines} />
      </LineChart>,
    );

    expect(screen.container.querySelectorAll('g line[stroke="#000000"]').length).toBe(0);
    vi.mocked(useXAxisScale).mockRestore();
  });
});

describe('AxisSpanLines outside a chart', () => {
  it('renders nothing when no plot area is available', async () => {
    const screen = await render(
      <svg width={400} height={300}>
        <AxisSpanLines />
      </svg>,
    );

    expect(screen.container.querySelectorAll('line').length).toBe(0);
  });
});
