import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';

import '@/styles/globals.css';
import { DataTable } from '../data-table';

describe('DataTable', () => {
  const headings = ['Label', 'Count', 'Rate'];
  const rows = [
    ['Alpha', '3', '0.5'],
    ['Beta', '7', '0.9'],
  ];

  it('renders a table with the given column headings', async () => {
    await render(<DataTable headings={headings} rows={rows} />);

    const columnHeaders = page.getByRole('columnheader');
    await expect.element(columnHeaders.nth(0)).toHaveTextContent('Label');
    await expect.element(columnHeaders.nth(1)).toHaveTextContent('Count');
    await expect.element(columnHeaders.nth(2)).toHaveTextContent('Rate');
  });

  it('renders one body row per data row with each cell value', async () => {
    await render(<DataTable headings={headings} rows={rows} />);

    const cells = page.getByRole('cell');
    await expect.element(cells.nth(0)).toHaveTextContent('Alpha');
    await expect.element(cells.nth(1)).toHaveTextContent('3');
    await expect.element(cells.nth(2)).toHaveTextContent('0.5');
    await expect.element(cells.nth(3)).toHaveTextContent('Beta');
    await expect.element(cells.nth(5)).toHaveTextContent('0.9');
    await expect.element(page.getByRole('row')).toHaveLength(3);
  });

  it('marks headings as column scope', async () => {
    await render(<DataTable headings={headings} rows={rows} />);

    const heading = page.getByRole('columnheader', { name: 'Count' });
    await expect.element(heading).toHaveAttribute('scope', 'col');
  });

  it('renders no body rows when given an empty rows array', async () => {
    await render(<DataTable headings={headings} rows={[]} />);

    await expect.element(page.getByRole('columnheader')).toHaveLength(3);
    await expect.element(page.getByRole('cell')).toHaveLength(0);
  });

  it('makes the first column sticky', async () => {
    await render(<DataTable headings={headings} rows={rows} />);

    const firstHeading = page.getByRole('columnheader', { name: 'Label' });
    const firstCell = page.getByRole('cell', { name: 'Alpha' });
    await expect.element(firstHeading).toHaveClass('sticky');
    await expect.element(firstCell).toHaveClass('sticky');
  });

  it('does not hard-code inverted text colors, so cells follow the theme', async () => {
    await render(<DataTable headings={headings} rows={rows} />);

    const cell = page.getByRole('cell', { name: 'Alpha' });
    await expect.element(cell).not.toHaveClass('dark:text-background');
    await expect.element(cell).toHaveClass('whitespace-nowrap');
  });

  it('resolves cell text to the theme foreground in light and dark mode', async () => {
    await render(<DataTable headings={['A']} rows={[['Alpha']]} />);
    const cell = document.querySelector('td') as HTMLElement;
    const root = document.documentElement;
    try {
      root.classList.remove('dark');
      await new Promise((r) => setTimeout(r, 600));
      expect(getComputedStyle(cell).color).toBe('rgb(9, 9, 11)');
      root.classList.add('dark');
      await new Promise((r) => setTimeout(r, 600));
      expect(getComputedStyle(cell).color).toBe('rgb(250, 250, 250)');
    } finally {
      root.classList.remove('dark');
    }
  });
});
