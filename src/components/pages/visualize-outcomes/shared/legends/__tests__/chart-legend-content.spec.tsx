import { render } from 'vitest-browser-react';
import { describe, it, expect } from 'vitest';

import { ChartLegendContent } from '../chart-legend-content';

const conditionEntry = {
  value: 'Baseline',
  kind: 'condition',
  type: 'circle',
  color: 'white',
};

const keyEntry = {
  value: 'Kicking',
  type: 'diamond',
  color: 'black',
};

describe('ChartLegendContent', () => {
  it('renders nothing but an empty list when there is no payload', async () => {
    await render(<ChartLegendContent />);

    const list = document.querySelector('.recharts-default-legend');
    expect(list).not.toBeNull();
    expect(list!.querySelectorAll('.recharts-legend-item').length).toBe(0);
  });

  it('renders one item per entry, in payload order, with black label text', async () => {
    await render(<ChartLegendContent payload={[conditionEntry, keyEntry]} />);

    const items = Array.from(document.querySelectorAll('.recharts-legend-item'));
    expect(items.map((item) => item.querySelector('.recharts-legend-item-text')!.textContent)).toEqual([
      'Baseline',
      'Kicking',
    ]);
    for (const item of items) {
      expect(getComputedStyle(item.querySelector('.recharts-legend-item-text')!).color).toBe('rgb(0, 0, 0)');
    }
  });

  it('outlines condition entries in black so a white fill stays visible', async () => {
    await render(<ChartLegendContent payload={[conditionEntry]} />);

    const marker = document.querySelector('.recharts-legend-item svg path')!;
    const style = getComputedStyle(marker);
    expect(style.stroke).toBe('rgb(0, 0, 0)');
    expect(style.strokeWidth).toBe('4px');
    expect(style.fill).toBe('rgb(255, 255, 255)');
  });

  it('keeps key entries as their own symbol with a fill and no outline', async () => {
    await render(<ChartLegendContent payload={[keyEntry]} />);

    const marker = document.querySelector('.recharts-legend-item svg path')!;
    const style = getComputedStyle(marker);
    expect(style.fill).toBe('rgb(0, 0, 0)');
    expect(style.stroke).not.toBe('rgb(0, 0, 0)');
  });

  it('stacks items in a column with spacing below each item for the vertical layout', async () => {
    await render(<ChartLegendContent payload={[conditionEntry, keyEntry]} layout="vertical" />);

    const list = document.querySelector<HTMLElement>('.recharts-default-legend')!;
    const item = document.querySelector<HTMLElement>('.recharts-legend-item')!;
    expect(getComputedStyle(list).flexDirection).toBe('column');
    expect(getComputedStyle(list).flexWrap).toBe('nowrap');
    expect(getComputedStyle(item).marginBottom).toBe('4px');
    expect(getComputedStyle(item).marginRight).toBe('0px');
  });

  it('aligns vertical items to the start when requested', async () => {
    await render(<ChartLegendContent payload={[conditionEntry]} layout="vertical" align="start" />);

    const list = document.querySelector<HTMLElement>('.recharts-default-legend')!;
    expect(getComputedStyle(list).alignItems).toBe('flex-start');
    expect(getComputedStyle(list).justifyContent).toBe('flex-start');
    expect(getComputedStyle(list).textAlign).toBe('start');
  });

  it('runs items across in a centered row with spacing to the right by default', async () => {
    await render(<ChartLegendContent payload={[conditionEntry, keyEntry]} />);

    const list = document.querySelector<HTMLElement>('.recharts-default-legend')!;
    const item = document.querySelector<HTMLElement>('.recharts-legend-item')!;
    expect(getComputedStyle(list).flexDirection).toBe('row');
    expect(getComputedStyle(list).justifyContent).toBe('center');
    expect(getComputedStyle(list).alignItems).toBe('center');
    expect(getComputedStyle(item).marginRight).toBe('10px');
    expect(getComputedStyle(item).marginBottom).toBe('0px');
  });

  it('keeps a rotated square inside the legend icon box', async () => {
    await render(<ChartLegendContent payload={[{ ...keyEntry, type: 'rotatedSquare' }]} />);

    const svg = document.querySelector<SVGSVGElement>('.recharts-legend-item svg')!;
    const marker = svg.querySelector<SVGPathElement>('path')!;
    const box = marker.getBoundingClientRect();
    const frame = svg.getBoundingClientRect();
    expect(box.width).toBeGreaterThan(0);
    expect(box.left).toBeGreaterThanOrEqual(frame.left);
    expect(box.top).toBeGreaterThanOrEqual(frame.top);
    expect(box.right).toBeLessThanOrEqual(frame.right);
    expect(box.bottom).toBeLessThanOrEqual(frame.bottom);
  });

  it('centers a triangle marker vertically in the legend icon box', async () => {
    await render(<ChartLegendContent payload={[{ ...keyEntry, type: 'triangle' }]} />);

    const svg = document.querySelector<SVGSVGElement>('.recharts-legend-item svg')!;
    const marker = svg.querySelector<SVGPathElement>('path')!;
    const box = marker.getBoundingClientRect();
    const frame = svg.getBoundingClientRect();
    const gapTop = box.top - frame.top;
    const gapBottom = frame.bottom - box.bottom;
    expect(Math.abs(gapTop - gapBottom)).toBeLessThan(1);
  });

  it('labels each icon with its entry value for accessibility', async () => {
    await render(<ChartLegendContent payload={[conditionEntry, keyEntry]} />);

    expect(document.querySelector('svg[aria-label="Baseline legend icon"]')).not.toBeNull();
    expect(document.querySelector('svg[aria-label="Kicking legend icon"]')).not.toBeNull();
  });
});
