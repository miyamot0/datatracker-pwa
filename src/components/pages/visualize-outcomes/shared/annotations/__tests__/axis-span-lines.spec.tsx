import { render } from 'vitest-browser-react';
import { vi, describe, it, expect } from 'vitest';
import { Line, LineChart, XAxis, YAxis } from 'recharts';

import { AxisSpanLines } from '../axis-span-lines';

const data = [
  { x: 0, y: 0 },
  { x: 5, y: 2 },
  { x: 10, y: 4 },
];

describe('AxisSpanLines', () => {
  it('draws an x span along the bottom and a y span along the left of the plot area', async () => {
    await render(
      <LineChart width={400} height={300} data={data}>
        <XAxis dataKey="x" type="number" domain={[0, 10]} ticks={[0, 5, 10]} />
        <YAxis domain={[0, 10]} ticks={[0, 5, 10]} />
        <Line dataKey="y" isAnimationActive={false} />
        <AxisSpanLines />
      </LineChart>,
    );

    await vi.waitFor(() => expect(document.querySelectorAll('.axis-span-line').length).toBe(2));

    const xLine = document.querySelector('.axis-span-line-x')!;
    const yLine = document.querySelector('.axis-span-line-y')!;
    // Horizontal x span: same y on both ends. Vertical y span: same x on both ends.
    expect(xLine.getAttribute('y1')).toBe(xLine.getAttribute('y2'));
    expect(yLine.getAttribute('x1')).toBe(yLine.getAttribute('x2'));
    expect(Number(xLine.getAttribute('y1'))).toBeGreaterThan(Number(yLine.getAttribute('y2')));
    expect(Number(yLine.getAttribute('x1'))).toBeLessThan(Number(xLine.getAttribute('x2')));
  });

  it('spans the x-axis from the first tick to the last tick', async () => {
    await render(
      <LineChart width={400} height={300} data={data}>
        <XAxis dataKey="x" type="number" domain={[0, 10]} ticks={[0, 5, 10]} />
        <YAxis domain={[0, 10]} ticks={[0, 5, 10]} />
        <Line dataKey="y" isAnimationActive={false} />
        <AxisSpanLines />
      </LineChart>,
    );

    await vi.waitFor(() => expect(document.querySelectorAll('.axis-span-line-x').length).toBe(1));

    const tickXs = Array.from(document.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick-line')).map(
      (el) => el.getBoundingClientRect().left,
    );
    const line = document.querySelector('.axis-span-line-x')!.getBoundingClientRect();

    expect(Math.abs(line.left - Math.min(...tickXs))).toBeLessThan(1);
    expect(Math.abs(line.right - Math.max(...tickXs))).toBeLessThan(1);
  });

  it('uses the default black stroke and 1px width when no props are given', async () => {
    await render(
      <LineChart width={400} height={300} data={data}>
        <XAxis dataKey="x" type="number" domain={[0, 10]} />
        <YAxis domain={[0, 10]} />
        <Line dataKey="y" isAnimationActive={false} />
        <AxisSpanLines />
      </LineChart>,
    );

    await vi.waitFor(() => expect(document.querySelectorAll('.axis-span-line').length).toBe(2));

    for (const line of Array.from(document.querySelectorAll('.axis-span-line'))) {
      expect(line.getAttribute('stroke')).toBe('black');
      expect(line.getAttribute('stroke-width')).toBe('1');
    }
  });

  it('applies a custom stroke and stroke width to both lines', async () => {
    await render(
      <LineChart width={400} height={300} data={data}>
        <XAxis dataKey="x" type="number" domain={[0, 10]} />
        <YAxis domain={[0, 10]} />
        <Line dataKey="y" isAnimationActive={false} />
        <AxisSpanLines stroke="red" strokeWidth={4} />
      </LineChart>,
    );

    await vi.waitFor(() => expect(document.querySelectorAll('.axis-span-line').length).toBe(2));

    for (const line of Array.from(document.querySelectorAll('.axis-span-line'))) {
      expect(line.getAttribute('stroke')).toBe('red');
      expect(line.getAttribute('stroke-width')).toBe('4');
    }
  });

  it('falls back to the plot edges when no series has registered a tick scale', async () => {
    await render(
      <LineChart width={400} height={300} data={[]}>
        <XAxis dataKey="x" type="number" domain={[0, 10]} />
        <YAxis domain={[0, 10]} />
        <AxisSpanLines />
      </LineChart>,
    );

    await vi.waitFor(() => expect(document.querySelectorAll('.axis-span-line').length).toBe(2));

    const xLine = document.querySelector('.axis-span-line-x')!;
    const yLine = document.querySelector('.axis-span-line-y')!;

    // With no tick scale, both spans meet at the plot's bottom-left corner.
    expect(xLine.getAttribute('x1')).toBe(yLine.getAttribute('x1'));
    expect(xLine.getAttribute('y1')).toBe(yLine.getAttribute('y1'));
    expect(Number(xLine.getAttribute('x2'))).toBeGreaterThan(Number(xLine.getAttribute('x1')));
    expect(Number(yLine.getAttribute('y2'))).toBeLessThan(Number(yLine.getAttribute('y1')));
  });
});
