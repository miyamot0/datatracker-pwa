// @ts-nocheck

import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';

import { DataTableTypeFilter } from '../data-table-type-filter';

function makeTable(initial) {
  const column = {
    value: initial,
    getFilterValue() {
      return this.value;
    },
    setFilterValue: vi.fn(function (v) {
      this.value = v;
    }),
  };
  return { column, table: { getColumn: (id) => (id === 'type' ? column : undefined) } };
}

describe('DataTableTypeFilter', () => {
  it('shows the default label when no type is selected', async () => {
    const { table } = makeTable(undefined);
    render(<DataTableTypeFilter table={table} />);
    await expect.element(page.getByRole('button', { name: 'Filter by Type' })).toBeVisible();
  });

  it('sets the type column filter when a type is chosen', async () => {
    const { column, table } = makeTable(undefined);
    render(<DataTableTypeFilter table={table} />);
    await page.getByRole('button', { name: 'Filter by Type' }).click();
    await page.getByRole('menuitemradio', { name: 'Figure Styles', exact: true }).click();
    expect(column.setFilterValue).toHaveBeenLastCalledWith('figure_styles');
  });

  it('clears the filter when "All types" is chosen', async () => {
    const { column, table } = makeTable('keyset');
    render(<DataTableTypeFilter table={table} />);
    await page.getByRole('button', { name: 'Type: Keyset' }).click();
    await page.getByRole('menuitemradio', { name: 'All types', exact: true }).click();
    expect(column.setFilterValue).toHaveBeenLastCalledWith(undefined);
  });
});
