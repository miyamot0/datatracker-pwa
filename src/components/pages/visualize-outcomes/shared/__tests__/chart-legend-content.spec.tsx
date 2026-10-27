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
    expect(style.strokeWidth).toBe('3px');
    expect(style.fill).toBe('rgb(255, 255, 255)');
  });

  it('keeps key entries as their own symbol with a fill and no outline', async () => {
    await render(<ChartLegendContent payload={[keyEntry]} />);

    const marker = document.querySelector('.recharts-legend-item svg path')!;
    const style = getComputedStyle(marker);
    expect(style.fill).toBe('rgb(0, 0, 0)');
    expect(style.stroke).not.toBe('rgb(0, 0, 0)');
  });

  it('labels each icon with its entry value for accessibility', async () => {
    await render(<ChartLegendContent payload={[conditionEntry, keyEntry]} />);

    expect(document.querySelector('svg[aria-label="Baseline legend icon"]')).not.toBeNull();
    expect(document.querySelector('svg[aria-label="Kicking legend icon"]')).not.toBeNull();
  });
});
