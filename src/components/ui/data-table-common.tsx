import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Checkbox } from './checkbox';
import type { Row, Table as TableData } from '@tanstack/react-table';
import { Button } from './button';
import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApplicationSettingsTypes } from '@/types/settings';

export type RowSelectOptions = 'None';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterCol?: string;
  rowSelectOptions?: RowSelectOptions;
  optionalButtons?: React.ReactNode;
  settings: ApplicationSettingsTypes;
  callback?: (rows: TData[]) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterCol,
  optionalButtons,
  callback,
  settings,
  rowSelectOptions = 'None',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const newColumns =
    callback && settings.EnableFileDeletion
      ? [
          {
            id: 'select',
            header: ({ table }: { table: TableData<TData> }) => (
              <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
                role="checkbox"
              />
            ),
            cell: ({ row }: { row: Row<TData> }) => (
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                role="checkbox"
              />
            ),
            enableSorting: false,
            enableHiding: false,
            size: 35,
            minSize: 35,
            maxSize: 35,
          },
          ...columns,
        ]
      : columns;

  const table = useReactTable({
    data,
    columns: newColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    defaultColumn: {
      size: 100,
      minSize: 1000,
      maxSize: 1000,
    },
  });

  return (
    <div className="">
      <div className="flex justify-between items-center py-4">
        {filterCol && (
          <Input
            placeholder={`Filter by ${filterCol}`}
            id="filter-input"
            type="text"
            value={table.getColumn(filterCol)?.getFilterValue() as string}
            onChange={(event) => table.getColumn(filterCol)?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
        )}

        <div className="flex gap-2">
          {callback && (
            <Button
              variant={'destructive'}
              size={'sm'}
              className={cn('shadow transition-opacity opacity-0 ease-in-out pointer-events-none', {
                'flex opacity-100 pointer-events-auto': table.getFilteredSelectedRowModel().rows.length > 0,
              })}
              onClick={() => {
                const selectedRows = table.getFilteredSelectedRowModel().rows;
                if (selectedRows.length > 0) {
                  callback(selectedRows.map((row) => row.original));
                  table.resetRowSelection();
                }
              }}
            >
              <Delete className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}

          {optionalButtons}
        </div>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    style={{
                      width: header.getSize(),
                    }}
                    role="checkbox"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="hover:bg-muted/50">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} style={{ width: `${cell.column.getSize()}px` }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={newColumns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DataTablePagination table={table} rowSelectOptions={rowSelectOptions} />
    </div>
  );
}
