import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import type { ColumnDef } from '@tanstack/react-table';

import '@/styles/globals.css';
import { DataTable } from '../data-table-common';
import { ReliabilityDataTable } from '../data-table-reli';
import type { ApplicationSettingsTypes } from '@/types/settings/application-settings';
import type { SyncEntryTableRow } from '@/types/sync';

type Row = { name: string; count: number };

const settings = (enableDeletion: boolean) => ({ EnableFileDeletion: enableDeletion }) as unknown as ApplicationSettingsTypes;

const simpleColumns: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'count', header: 'Count' },
];

const rows: Row[] = [
  { name: 'Alpha', count: 3 },
  { name: 'Beta', count: 7 },
];

describe('DataTable selection and actions', () => {
  it('shows a select-all checkbox and deletes every selected row through the callback', async () => {
    const callback = vi.fn();
    await render(
      <DataTable columns={simpleColumns} data={rows} settings={settings(true)} callback={callback} />,
    );

    await page.getByRole('checkbox', { name: 'Select all' }).last().click();
    await page.getByRole('button', { name: 'Delete' }).click();

    expect(callback).toHaveBeenCalledWith(rows);
    await expect.element(page.getByRole('checkbox', { name: 'Select all' }).last()).toHaveAttribute('aria-checked', 'false');
  });

  it('passes only the individually selected row to the callback', async () => {
    const callback = vi.fn();
    await render(
      <DataTable columns={simpleColumns} data={rows} settings={settings(true)} callback={callback} />,
    );

    await page.getByRole('checkbox', { name: 'Select row' }).first().click();
    await page.getByRole('button', { name: 'Delete' }).click();

    expect(callback).toHaveBeenCalledWith([rows[0]]);
  });

  it('does not call the callback when the action button is pressed with nothing selected', async () => {
    const callback = vi.fn();
    await render(
      <DataTable columns={simpleColumns} data={rows} settings={settings(true)} callback={callback} />,
    );

    await page.getByRole('button', { name: 'Delete' }).click({ force: true });
    expect(callback).not.toHaveBeenCalled();
  });

  it('hides the selection column when deletion is disabled and no checkbox is forced', async () => {
    await render(<DataTable columns={simpleColumns} data={rows} settings={settings(false)} />);

    expect(page.getByRole('checkbox', { name: 'Select all' }).last().elements()).toHaveLength(0);
    await expect.element(page.getByRole('cell', { name: 'Alpha' })).toBeVisible();
  });

  it('shows the selection column when forced even without a callback', async () => {
    await render(<DataTable columns={simpleColumns} data={rows} settings={settings(false)} forceShowCheckbox />);

    await expect.element(page.getByRole('checkbox', { name: 'Select all' }).last()).toBeVisible();
    expect(page.getByRole('button', { name: 'Delete' }).elements()).toHaveLength(0);
  });

  it('renders a custom checkbox button that uses the primary callback', async () => {
    const callback = vi.fn();
    await render(
      <DataTable
        columns={simpleColumns}
        data={rows}
        settings={settings(true)}
        callback={callback}
        customCheckboxButton={<span>Custom action</span>}
      />,
    );

    await page.getByRole('checkbox', { name: 'Select all' }).last().click();
    await page.getByRole('button', { name: 'Custom action' }).click();
    expect(callback).toHaveBeenCalledWith(rows);
  });

  it('renders the alternative button for the second callback', async () => {
    const callback2 = vi.fn();
    await render(
      <DataTable
        columns={simpleColumns}
        data={rows}
        settings={{ EnableFileDeletion: false } as unknown as ApplicationSettingsTypes}
        forceShowCheckbox
        callback2={callback2}
        customCheckboxButton2={<span>Second action</span>}
      />,
    );

    await page.getByRole('checkbox', { name: 'Select row' }).first().click();
    await page.getByRole('button', { name: 'Second action' }).click();
    expect(callback2).toHaveBeenCalledWith([rows[0]]);
  });

  it('renders optional buttons supplied by the parent', async () => {
    await render(
      <DataTable columns={simpleColumns} data={rows} settings={settings(false)} optionalButtons={<span>Extra tool</span>} />,
    );
    await expect.element(page.getByText('Extra tool')).toBeVisible();
  });

  it('filters rows by the given column through its input', async () => {
    await render(<DataTable columns={simpleColumns} data={rows} settings={settings(false)} filterCol="name" />);

    await page.getByPlaceholder('Filter by name').fill('Beta');
    await expect.element(page.getByRole('cell', { name: 'Beta' })).toBeVisible();
    expect(page.getByRole('cell', { name: 'Alpha' }).elements()).toHaveLength(0);
  });

  it('toggles columns from the edit-columns menu when limitCols is set', async () => {
    await render(<DataTable columns={simpleColumns} data={rows} settings={settings(false)} limitCols />);

    await page.getByRole('button', { name: 'Edit Columns Displayed' }).click();
    await expect.element(page.getByRole('menuitemcheckbox', { name: 'count' })).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('menuitemcheckbox', { name: 'count' }).click();
    await expect.element(page.getByRole('menuitemcheckbox', { name: 'count' })).toHaveAttribute('aria-checked', 'false');
  });

  it('starts with columns listed in hiddenCols hidden', async () => {
    await render(
      <DataTable columns={simpleColumns} data={rows} settings={settings(false)} hiddenCols={{ count: false }} />,
    );

    expect(page.getByRole('cell', { name: '3' }).elements()).toHaveLength(0);
    await expect.element(page.getByRole('cell', { name: 'Alpha' })).toBeVisible();
  });

  it('shows the empty message when there are no rows', async () => {
    await render(<DataTable columns={simpleColumns} data={[]} settings={settings(false)} />);
    await expect.element(page.getByText('No results.')).toBeVisible();
  });
});

describe('ReliabilityDataTable', () => {
  const selectColumn: ColumnDef<SyncEntryTableRow, unknown> = {
    id: 'select',
    header: () => null,
    cell: ({ row }) => (
      <input
        type="checkbox"
        aria-label="Select row"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  };

  const columns: ColumnDef<SyncEntryTableRow, unknown>[] = [
    selectColumn,
    { accessorKey: 'file', header: 'File' },
    { accessorKey: 'group', header: 'Group' },
    { accessorKey: 'individual', header: 'Individual' },
    { accessorKey: 'evaluation', header: 'Evaluation' },
    { accessorKey: 'condition', header: 'Condition' },
    { accessorKey: 'type', header: 'Type' },
  ];

  const base = { direction: 'to_remote', status: 'ok' };
  const reliRows: SyncEntryTableRow[] = [
    {
      ...base,
      id: '1',
      file: 'alpha.json',
      group: 'Group_A',
      individual: 'ind_1',
      evaluation: 'eval_1',
      condition: 'cond_x',
      type: 'keyset',
    },
    {
      ...base,
      id: '2',
      file: 'beta.json',
      group: 'Group_B',
      individual: 'ind_2',
      evaluation: 'eval_2',
      condition: 'cond_y',
      type: 'figure_styles',
    },
  ];

  it('filters by clicking a value and clears the filter from its badge', async () => {
    await render(<ReliabilityDataTable columns={columns} data={reliRows} callback={vi.fn()} direction="Remote" />);

    await page.getByRole('cell', { name: 'Group_A', exact: true }).click();
    await expect.element(page.getByText('Filtered by:')).toBeVisible();
    await expect.element(page.getByText('Group A')).toBeVisible();
    expect(page.getByRole('cell', { name: 'Group_B', exact: true }).elements()).toHaveLength(0);

    await page.getByRole('button', { name: 'Clear group filter' }).click();
    expect(page.getByText('Filtered by:').elements()).toHaveLength(0);
    await expect.element(page.getByRole('cell', { name: 'Group_B', exact: true })).toBeVisible();
  });

  it('does not filter when a value in a filter column looks like a file name', async () => {
    const withFilename: SyncEntryTableRow[] = [{ ...reliRows[0], group: 'report.v2' }];
    await render(<ReliabilityDataTable columns={columns} data={withFilename} callback={vi.fn()} direction="Local" />);

    const cell = page.getByRole('cell', { name: 'report.v2', exact: true });
    await expect.element(cell).not.toHaveClass('cursor-pointer');
    await cell.click();
    expect(page.getByText('Filtered by:').elements()).toHaveLength(0);
  });

  it('filters the file column by its text input', async () => {
    await render(<ReliabilityDataTable columns={columns} data={reliRows} callback={vi.fn()} direction="Remote" />);

    await page.getByPlaceholder('Filter by File Name').fill('beta');
    await expect.element(page.getByRole('cell', { name: 'beta.json' })).toBeVisible();
    expect(page.getByRole('cell', { name: 'alpha.json' }).elements()).toHaveLength(0);
  });

  it('syncs the selected rows through the callback and shows optional buttons', async () => {
    const callback = vi.fn();
    await render(
      <ReliabilityDataTable
        columns={columns}
        data={reliRows}
        callback={callback}
        direction="Remote"
        optionalButtons={<span>Extra sync</span>}
      />,
    );

    await page.getByRole('checkbox', { name: 'Select row' }).first().click();
    await expect.element(page.getByRole('button', { name: 'Sync File to Remote' })).toBeVisible();
    await expect.element(page.getByText('Extra sync')).toBeVisible();

    await page.getByRole('button', { name: 'Sync File to Remote' }).click();
    expect(callback).toHaveBeenCalledWith([reliRows[0]]);
  });

  it('reveals the hidden condition column from the column menu', async () => {
    await render(<ReliabilityDataTable columns={columns} data={reliRows} callback={vi.fn()} direction="Local" />);

    expect(page.getByRole('cell', { name: 'cond_x' }).elements()).toHaveLength(0);
    await page.getByRole('button', { name: 'Show/Hide Columns' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'condition' }).click();
    await expect.element(page.getByRole('cell', { name: 'cond_x' })).toBeVisible();
  });

  it('shows the empty message when there are no rows', async () => {
    await render(<ReliabilityDataTable columns={columns} data={[]} callback={vi.fn()} direction="Local" />);
    await expect.element(page.getByText('No results.')).toBeVisible();
  });
});
