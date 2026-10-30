'use client';

import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { Table } from '@tanstack/react-table';
import { ListFilter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'keyset', label: 'Keyset' },
  { value: 'session_parameters', label: 'Session Parameters' },
  { value: 'session_outcome', label: 'Session Outcome' },
  { value: 'figure_styles', label: 'Figure Styles' },
];

interface DataTableTypeFilterProps<TData> {
  table: Table<TData>;
  columnId?: string;
}

/**
 * Dropdown that filters a table to a single file type using the given column's filter value.
 */
export function DataTableTypeFilter<TData>({ table, columnId = 'type' }: DataTableTypeFilterProps<TData>) {
  const column = table.getColumn(columnId);
  const current = (column?.getFilterValue() as string | undefined) ?? '';
  const activeLabel = TYPE_OPTIONS.find((option) => option.value === current)?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="shadow-xs" disabled={!column}>
          <ListFilter className="h-4 w-4 mr-2" />
          {activeLabel ? `Type: ${activeLabel}` : 'Filter by Type'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>File type</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(value) => column?.setFilterValue(value === '' ? undefined : value)}
        >
          <DropdownMenuRadioItem value="">All types</DropdownMenuRadioItem>
          {TYPE_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
