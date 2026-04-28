// @ts-nocheck

import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';

import { syncColumns } from '../sync-columns';

// ----- Module mocks -----

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, 'aria-label': ariaLabel }) => (
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      aria-label={ariaLabel}
    />
  ),
}));

vi.mock('@/components/ui/data-table-column-header', () => ({
  DataTableColumnHeader: ({ title }) => <span>{title}</span>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  ),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => {
    const flatten = (v: unknown): string[] => {
      if (!v) return [];
      if (typeof v === 'string') return [v];
      if (typeof v === 'object')
        return Object.entries(v as Record<string, unknown>)
          .filter(([, val]) => val)
          .map(([k]) => k);
      return [];
    };
    return args.flatMap(flatten).join(' ');
  },
}));

// ----- Helpers -----

const findCol = (key: string) => syncColumns.find((c) => ('accessorKey' in c ? c.accessorKey === key : c.id === key))!;

const mockTable = {
  getIsAllPageRowsSelected: () => false,
  getIsSomePageRowsSelected: () => false,
  toggleAllPageRowsSelected: vi.fn(),
};

const mockColumn = (id: string) => ({
  id,
  toggleSorting: vi.fn(),
  getIsSorted: () => false,
});

// ----- Tests -----

describe('syncColumns', () => {
  it('exports 7 column definitions', () => {
    expect(syncColumns).toHaveLength(7);
  });

  it('columns are in the correct order', () => {
    const keys = syncColumns.map((c) => ('accessorKey' in c ? c.accessorKey : c.id));
    expect(keys).toEqual(['select', 'group', 'individual', 'evaluation', 'condition', 'type', 'file']);
  });

  describe('select column', () => {
    const col = findCol('select');

    it('has sorting and hiding disabled', () => {
      expect(col.enableSorting).toBe(false);
      expect(col.enableHiding).toBe(false);
    });

    it('header renders a "Select all" checkbox', async () => {
      const HeaderFn = col.header;
      render(<HeaderFn table={mockTable} />);
      await expect.element(page.getByRole('checkbox', { name: 'Select all' })).toBeInTheDocument();
    });

    it('header checkbox is unchecked when no rows are selected', async () => {
      const HeaderFn = col.header;
      render(<HeaderFn table={mockTable} />);
      await expect.element(page.getByRole('checkbox', { name: 'Select all' })).not.toBeChecked();
    });

    it('header checkbox is checked when all rows are selected', async () => {
      const HeaderFn = col.header;
      const allSelectedTable = { ...mockTable, getIsAllPageRowsSelected: () => true };
      render(<HeaderFn table={allSelectedTable} />);
      await expect.element(page.getByRole('checkbox', { name: 'Select all' })).toBeChecked();
    });

    it('cell renders a "Select row" checkbox', async () => {
      const CellFn = col.cell;
      render(<CellFn row={{ getIsSelected: () => false, toggleSelected: vi.fn() }} />);
      await expect.element(page.getByRole('checkbox', { name: 'Select row' })).toBeInTheDocument();
    });

    it('cell checkbox is unchecked when row is not selected', async () => {
      const CellFn = col.cell;
      render(<CellFn row={{ getIsSelected: () => false, toggleSelected: vi.fn() }} />);
      await expect.element(page.getByRole('checkbox', { name: 'Select row' })).not.toBeChecked();
    });

    it('cell checkbox is checked when row is selected', async () => {
      const CellFn = col.cell;
      render(<CellFn row={{ getIsSelected: () => true, toggleSelected: vi.fn() }} />);
      await expect.element(page.getByRole('checkbox', { name: 'Select row' })).toBeChecked();
    });
  });

  describe('group column', () => {
    const col = findCol('group');

    it('header renders "Group"', async () => {
      const HeaderFn = col.header;
      render(<HeaderFn column={mockColumn('group')} />);
      await expect.element(page.getByText('Group')).toBeInTheDocument();
    });
  });

  describe('individual column', () => {
    const col = findCol('individual');

    it('header renders "Individual"', async () => {
      const HeaderFn = col.header;
      render(<HeaderFn column={mockColumn('individual')} />);
      await expect.element(page.getByText('Individual')).toBeInTheDocument();
    });
  });

  describe('evaluation column', () => {
    const col = findCol('evaluation');

    it('header renders "Evaluation"', async () => {
      const HeaderFn = col.header;
      render(<HeaderFn column={mockColumn('evaluation')} />);
      await expect.element(page.getByText('Evaluation')).toBeInTheDocument();
    });

    it('cell renders a plain evaluation name', async () => {
      const CellFn = col.cell;
      render(<CellFn getValue={() => 'Baseline'} />);
      await expect.element(page.getByText('Baseline')).toBeInTheDocument();
    });

    it('cell renders nothing when value is a filename', async () => {
      const CellFn = col.cell;
      render(
        <div data-testid="eval-cell">
          <CellFn getValue={() => 'settings.json'} />
        </div>,
      );
      await expect.element(page.getByTestId('eval-cell')).toHaveTextContent('');
    });

    it('cell renders nothing for filenames with multi-char extensions', async () => {
      const CellFn = col.cell;
      render(
        <div data-testid="eval-cell2">
          <CellFn getValue={() => 'data.xlsx'} />
        </div>,
      );
      await expect.element(page.getByTestId('eval-cell2')).toHaveTextContent('');
    });
  });

  describe('condition column', () => {
    const col = findCol('condition');

    it('header renders "Condition"', async () => {
      const HeaderFn = col.header;
      render(<HeaderFn column={mockColumn('condition')} />);
      await expect.element(page.getByText('Condition')).toBeInTheDocument();
    });

    it('cell renders a non-empty condition name', async () => {
      const CellFn = col.cell;
      render(<CellFn getValue={() => 'Treatment'} />);
      await expect.element(page.getByText('Treatment')).toBeInTheDocument();
    });

    it('cell renders nothing when value is empty', async () => {
      const CellFn = col.cell;
      render(
        <div data-testid="condition-cell">
          <CellFn getValue={() => ''} />
        </div>,
      );
      await expect.element(page.getByTestId('condition-cell')).toHaveTextContent('');
    });
  });

  describe('type column', () => {
    const col = findCol('type');

    it('header renders "Type"', async () => {
      const HeaderFn = col.header;
      render(<HeaderFn column={mockColumn('type')} />);
      await expect.element(page.getByText('Type')).toBeInTheDocument();
    });

    it('cell renders "KeySet" badge for keyset', async () => {
      const CellFn = col.cell;
      render(<CellFn getValue={() => 'keyset'} />);
      await expect.element(page.getByText('KeySet')).toBeInTheDocument();
    });

    it('cell renders "Session Parameters" badge for session_parameters', async () => {
      const CellFn = col.cell;
      render(<CellFn getValue={() => 'session_parameters'} />);
      await expect.element(page.getByText('Session Parameters')).toBeInTheDocument();
    });

    it('cell renders "Session Outcome" badge for session_outcome', async () => {
      const CellFn = col.cell;
      render(<CellFn getValue={() => 'session_outcome'} />);
      await expect.element(page.getByText('Session Outcome')).toBeInTheDocument();
    });

    it('cell applies blue class for keyset', async () => {
      const CellFn = col.cell;
      render(<CellFn getValue={() => 'keyset'} />);
      await expect.element(page.getByTestId('badge')).toHaveClass('bg-blue-600');
    });

    it('cell applies teal class for session_parameters', async () => {
      const CellFn = col.cell;
      render(<CellFn getValue={() => 'session_parameters'} />);
      await expect.element(page.getByTestId('badge')).toHaveClass('bg-teal-600');
    });

    it('cell applies amber class for session_outcome', async () => {
      const CellFn = col.cell;
      render(<CellFn getValue={() => 'session_outcome'} />);
      await expect.element(page.getByTestId('badge')).toHaveClass('bg-amber-600');
    });

    it('cell renders nothing when value is a filename', async () => {
      const CellFn = col.cell;
      render(
        <div data-testid="type-cell">
          <CellFn getValue={() => 'data.json'} />
        </div>,
      );
      await expect.element(page.getByTestId('type-cell')).toHaveTextContent('');
    });
  });

  describe('file column', () => {
    const col = findCol('file');

    it('header renders "File Path"', async () => {
      const HeaderFn = col.header;
      render(<HeaderFn column={mockColumn('file')} />);
      await expect.element(page.getByText('File Path')).toBeInTheDocument();
    });
  });
});
