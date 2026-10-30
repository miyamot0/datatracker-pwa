import { render } from 'vitest-browser-react';
import { vi, describe, it, expect } from 'vitest';
import { Line, LineChart, XAxis, YAxis } from 'recharts';

import { AimLinesLayer } from '../aim-lines-layer';
import type { AimLine } from '@/lib/graphing/series-style';

const data = [
  { x: 0, y: 0 },
  { x: 10, y: 10 },
];

function AimChart({ aimLines }: { aimLines: AimLine[] }) {
  return (
    <LineChart width={400} height={300} data={data}>
      <XAxis dataKey="x" type="number" domain={[0, 10]} ticks={[0, 5, 10]} />
      <YAxis domain={[0, 10]} ticks={[0, 5, 10]} />
      <Line dataKey="y" isAnimationActive={false} />
      <AimLinesLayer aimLines={aimLines} />
    </LineChart>
  );
}

/** Pixel positions of the x ticks for 0, 5, and 10, and the y ticks for 0, 5, and 10 (in ticks order) */
function tickPositions() {
  const xs = Array.from(document.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick-line')).map((el) =>
    Number(el.getAttribute('x1')),
  );
  const ys = Array.from(document.querySelectorAll('.recharts-yAxis .recharts-cartesian-axis-tick-line')).map((el) =>
    Number(el.getAttribute('y1')),
  );

  return { xs, ys };
}

function linesWithColor(color: string): SVGLineElement[] {
  return Array.from(document.querySelectorAll<SVGLineElement>(`line[stroke="${color}"]`));
}

async function waitForChart() {
  await vi.waitFor(() => expect(tickPositions().xs.length).toBe(3));
}

describe('AimLinesLayer', () => {
  it('draws a horizontal line from X1 to X2 at the data Y value', async () => {
    await render(<AimChart aimLines={[{ x1: 0, x2: 10, y: 5, lineType: 'solid', color: '#4E9CB5' }]} />);
    await waitForChart();

    const [line] = linesWithColor('#4E9CB5');
    const { xs, ys } = tickPositions();

    expect(line).toBeDefined();
    expect(Math.abs(Number(line.getAttribute('x1')) - xs[0])).toBeLessThan(0.5);
    expect(Math.abs(Number(line.getAttribute('x2')) - xs[2])).toBeLessThan(0.5);
    expect(line.getAttribute('y1')).toBe(line.getAttribute('y2'));
    expect(Math.abs(Number(line.getAttribute('y1')) - ys[1])).toBeLessThan(0.5);
  });

  it('clips a line that extends past the plot area to its edges', async () => {
    await render(<AimChart aimLines={[{ x1: -5, x2: 20, y: 5, lineType: 'solid', color: '#4BC599' }]} />);
    await waitForChart();

    const [line] = linesWithColor('#4BC599');
    const { xs } = tickPositions();

    expect(line).toBeDefined();
    expect(Math.abs(Number(line.getAttribute('x1')) - xs[0])).toBeLessThan(0.5);
    expect(Math.abs(Number(line.getAttribute('x2')) - xs[2])).toBeLessThan(0.5);
  });

  it('skips aim lines that lie entirely outside the plot area', async () => {
    await render(
      <AimChart
        aimLines={[
          { x1: 0, x2: 10, y: 50, lineType: 'solid', color: '#F9A826' },
          { x1: 20, x2: 30, y: 5, lineType: 'solid', color: '#EB540A' },
          { x1: 0, x2: 10, y: 5, lineType: 'solid', color: '#14B694' },
        ]}
      />,
    );
    await vi.waitFor(() => expect(linesWithColor('#14B694').length).toBe(1));

    expect(linesWithColor('#F9A826')).toHaveLength(0);
    expect(linesWithColor('#EB540A')).toHaveLength(0);
  });

  it('applies the line type dash pattern and color', async () => {
    await render(
      <AimChart
        aimLines={[
          { x1: 0, x2: 10, y: 2, lineType: 'solid', color: '#9061C2' },
          { x1: 0, x2: 10, y: 4, lineType: 'dashed', color: '#C86F98' },
          { x1: 0, x2: 10, y: 6, lineType: 'dotted', color: '#000000' },
        ]}
      />,
    );
    await vi.waitFor(() => expect(linesWithColor('#000000').length).toBe(1));

    expect(linesWithColor('#9061C2')[0].hasAttribute('stroke-dasharray')).toBe(false);
    expect(linesWithColor('#C86F98')[0].getAttribute('stroke-dasharray')).toBe('8 4');
    expect(linesWithColor('#000000')[0].getAttribute('stroke-dasharray')).toBe('2 3');
  });
});
