import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
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
import { Button } from './button';
import { RefreshCcw, X } from 'lucide-react';
import { Badge } from './badge';
import { SyncEntryTableRow } from '@/types/sync';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  optionalButtons?: React.ReactNode;
  callback: (row: SyncEntryTableRow[]) => void;
  direction: 'Local' | 'Remote';
}

export function ReliabilityDataTable<TData, TValue>({
  columns,
  data,
  optionalButtons,
  callback,
  direction,
}: DataTableProps<TData, TValue>) {
  const FILTER_COLS = ['group', 'individual', 'evaluation', 'type'] as const;
  type FilterCol = (typeof FILTER_COLS)[number];

  const BADGE_COLORS: Record<FilterCol, string> = {
    group: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
    individual: 'bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200',
    evaluation: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200',
    type: 'bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200',
  };

  const isFilename = (value: unknown): boolean => typeof value === 'string' && /\.[a-zA-Z0-9]+$/.test(value);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    defaultColumn: {
      minSize: 50, //enforced during column resizing
      //maxSize: 500, //enforced during column resizing
    },
  });

  return (
    <div className="">
      {FILTER_COLS.some((col) => table.getColumn(col)?.getFilterValue()) && (
        <div className="flex flex-wrap items-center gap-2 pt-4">
          <span className="text-sm text-muted-foreground">Filtered by:</span>
          {FILTER_COLS.map((col) => {
            const value = table.getColumn(col)?.getFilterValue() as string | undefined;
            if (!value) return null;
            return (
              <Badge key={col} variant="outline" className={cn('flex items-center gap-1', BADGE_COLORS[col])}>
                <span className="capitalize">{col}:</span> {value}
                <button
                  onClick={() => table.getColumn(col)?.setFilterValue(undefined)}
                  className="ml-1 rounded-full"
                  aria-label={`Clear ${col} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
      <div className="flex justify-between items-center py-4">
        <Input
          placeholder={`Filter by File Name`}
          value={table.getColumn('file')?.getFilterValue() as string}
          onChange={(event) => table.getColumn('file')?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />

        <div
          className={cn('hidden', {
            'visible flex': table.getFilteredSelectedRowModel().rows.length > 0,
          })}
        >
          <Button
            size={'sm'}
            variant={'outline'}
            onClick={() => {
              const selectedRows = table
                .getFilteredSelectedRowModel()
                .rows.map((row) => row.original) as SyncEntryTableRow[];
              callback(selectedRows);

              setRowSelection({});
            }}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            {`Sync File to ${direction}`}
          </Button>
          {optionalButtons}
        </div>
      </div>
      <Table>
        <TableHeader className="w-full">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="">
              {headerGroup.headers.map((header, index, arr) => {
                return (
                  <TableHead
                    key={header.id}
                    className={cn('', {
                      'w-full': index === arr.length - 1,
                      'max-w-10': index === 0,
                      'whitespace-nowrap': index < arr.length - 1,
                    })}
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
                {row.getVisibleCells().map((cell, index, arr) => (
                  <TableCell
                    key={cell.id}
                    className={cn('', {
                      'whitespace-nowrap': index < arr.length - 1,
                      'cursor-pointer hover:underline':
                        FILTER_COLS.includes(cell.column.id as FilterCol) && !isFilename(cell.getValue()),
                    })}
                    onClick={
                      FILTER_COLS.includes(cell.column.id as FilterCol) && !isFilename(cell.getValue())
                        ? () => table.getColumn(cell.column.id)?.setFilterValue(cell.getValue())
                        : undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DataTablePagination table={table} rowSelectOptions={'None'} />
    </div>
  );
}
