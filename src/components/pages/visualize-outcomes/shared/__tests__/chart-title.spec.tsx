import React from 'react';
import { render } from 'vitest-browser-react';
import { describe, it, expect } from 'vitest';
import { ChartTitle } from '../chart-title';

describe('ChartTitle', () => {
  it('renders the title text', async () => {
    await render(
      <svg>
        <ChartTitle title="My Figure" fontPx={24} y={25} />
      </svg>,
    );
    expect(document.querySelector('text')?.textContent).toBe('My Figure');
  });

  it('centers the title horizontally and places it at the given y', async () => {
    await render(
      <svg>
        <ChartTitle title="My Figure" fontPx={24} y={33} />
      </svg>,
    );
    const text = document.querySelector('text');
    expect(text?.getAttribute('x')).toBe('50%');
    expect(text?.getAttribute('y')).toBe('33');
    expect(text?.getAttribute('text-anchor')).toBe('middle');
  });

  it('applies the given font size to the title', async () => {
    await render(
      <svg>
        <ChartTitle title="My Figure" fontPx={36} y={36} />
      </svg>,
    );
    const tspan = document.querySelector('tspan') as SVGTSpanElement | null;
    expect(tspan?.style.fontSize).toBe('36px');
  });
});
