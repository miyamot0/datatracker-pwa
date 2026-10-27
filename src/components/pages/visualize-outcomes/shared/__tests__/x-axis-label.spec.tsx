import React from 'react';
import { render } from 'vitest-browser-react';
import { describe, it, expect } from 'vitest';
import { XAxisLabel } from '../x-axis-label';

const axisBand = { x: 40, y: 300, width: 500, height: 50 };

describe('XAxisLabel', () => {
  it('renders nothing without a viewBox', async () => {
    await render(
      <svg>
        <XAxisLabel value="Session" offset={0} />
      </svg>,
    );
    expect(document.querySelector('text')).toBeNull();
  });

  it('renders the label text', async () => {
    await render(
      <svg>
        <XAxisLabel viewBox={axisBand} value="Session" offset={0} />
      </svg>,
    );
    expect(document.querySelector('text')?.textContent).toBe('Session');
  });

  it('centers the label horizontally within the axis band', async () => {
    await render(
      <svg>
        <XAxisLabel viewBox={axisBand} value="Session" offset={0} />
      </svg>,
    );
    expect(document.querySelector('text')?.getAttribute('x')).toBe(String(40 + 500 / 2));
    expect(document.querySelector('text')?.getAttribute('text-anchor')).toBe('middle');
  });

  it('anchors the baseline to the bottom of the band minus the offset', async () => {
    await render(
      <svg>
        <XAxisLabel viewBox={axisBand} value="Session" offset={8} />
      </svg>,
    );
    expect(document.querySelector('text')?.getAttribute('y')).toBe(String(300 + 50 - 8));
  });
});
