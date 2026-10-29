import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { useState, type ReactNode } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  Table,
  useReactTable,
} from '@tanstack/react-table';

import '@/styles/globals.css';
import { DataTablePagination } from '../data-table-pagination';
import { DataTableViewOptions } from '../data-table-column-visibility';
import { DataTableColumnHeader } from '../data-table-column-header';

type Row = { name: string; count: number };

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'count', header: 'Count' },
  { id: 'actions', header: 'Actions', cell: () => 'x' },
];

function Harness({ data, cols = columns, children }: { data: Row[]; cols?: ColumnDef<Row, unknown>[]; children: (table: Table<Row>) => ReactNode }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns: cols,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  return <>{children(table)}</>;
}

const manyRows: Row[] = Array.from({ length: 25 }, (_, i) => ({ name: `Row ${i + 1}`, count: i + 1 }));

describe('DataTablePagination', () => {
  it('shows the selection summary and the current page position', async () => {
    await render(<Harness data={manyRows}>{(table) => <DataTablePagination table={table} />}</Harness>);

    await expect.element(page.getByText('0 of 25 row(s) selected.')).toBeVisible();
    await expect.element(page.getByText('Page 1 of 3')).toBeVisible();
  });

  it('moves between pages with the navigation buttons and disables them at the edges', async () => {
    await render(<Harness data={manyRows}>{(table) => <DataTablePagination table={table} />}</Harness>);

    const first = page.getByRole('button', { name: 'Go to first page' });
    const prev = page.getByRole('button', { name: 'Go to previous page' });
    const next = page.getByRole('button', { name: 'Go to next page' });
    const last = page.getByRole('button', { name: 'Go to last page' });

    await expect.element(first).toBeDisabled();
    await expect.element(prev).toBeDisabled();

    await next.click();
    await expect.element(page.getByText('Page 2 of 3')).toBeVisible();

    await prev.click();
    await expect.element(page.getByText('Page 1 of 3')).toBeVisible();

    await last.click();
    await expect.element(page.getByText('Page 3 of 3')).toBeVisible();
    await expect.element(next).toBeDisabled();
    await expect.element(last).toBeDisabled();

    await first.click();
    await expect.element(page.getByText('Page 1 of 3')).toBeVisible();
  });

  it('changes the page size from the rows-per-page select', async () => {
    await render(<Harness data={manyRows}>{(table) => <DataTablePagination table={table} />}</Harness>);

    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: '20', exact: true }).click();
    await expect.element(page.getByText('Page 1 of 2')).toBeVisible();
  });
});

describe('DataTableViewOptions', () => {
  it('lists hideable columns and toggles their visibility', async () => {
    await render(
      <Harness data={manyRows}>
        {(table) => (
          <>
            <DataTableViewOptions table={table} />
            <table>
              <thead>
                <tr>
                  {table.getVisibleLeafColumns().map((column) => (
                    <th key={column.id}>{column.id}</th>
                  ))}
                </tr>
              </thead>
            </table>
          </>
        )}
      </Harness>,
    );

    await page.getByRole('button', { name: 'Show/Hide Columns' }).click();
    await expect.element(page.getByText('Toggle columns')).toBeVisible();
    await expect.element(page.getByRole('menuitemcheckbox', { name: 'name' })).toBeVisible();
    await expect.element(page.getByRole('menuitemcheckbox', { name: 'count' })).toHaveAttribute('aria-checked', 'true');
    expect(page.getByRole('menuitemcheckbox', { name: 'actions' }).elements()).toHaveLength(0);

    await page.getByRole('menuitemcheckbox', { name: 'count' }).click();
    await expect.element(page.getByRole('menuitemcheckbox', { name: 'count' })).toHaveAttribute('aria-checked', 'false');
  });
});

describe('DataTableColumnHeader', () => {
  it('renders only the title for a column that cannot be sorted', async () => {
    const cols: ColumnDef<Row, unknown>[] = [{ accessorKey: 'name', header: 'Name', enableSorting: false }];
    await render(
      <Harness data={manyRows} cols={cols}>
        {(table) => <DataTableColumnHeader column={table.getColumn('name')!} title="Fixed title" className="fixed-x" />}
      </Harness>,
    );

    await expect.element(page.getByText('Fixed title')).toHaveClass('fixed-x');
    expect(page.getByRole('button', { name: 'Fixed title' }).elements()).toHaveLength(0);
  });

  it('sorts the column ascending and descending from its menu', async () => {
    const data: Row[] = [
      { name: 'Beta', count: 2 },
      { name: 'Alpha', count: 1 },
      { name: 'Zeta', count: 3 },
    ];
    await render(
      <Harness data={data}>
        {(table) => (
          <>
            <DataTableColumnHeader column={table.getColumn('name')!} title="Name" />
            <div data-testid="order">{table.getRowModel().rows.map((r) => r.original.name).join(',')}</div>
          </>
        )}
      </Harness>,
    );

    await page.getByRole('button', { name: 'Name' }).click();
    await page.getByRole('menuitem', { name: 'Desc' }).click();
    await expect.element(page.getByTestId('order')).toHaveTextContent('Zeta,Beta,Alpha');

    await page.getByRole('button', { name: 'Name' }).click();
    await page.getByRole('menuitem', { name: 'Asc' }).click();
    await expect.element(page.getByTestId('order')).toHaveTextContent('Alpha,Beta,Zeta');
  });
});
