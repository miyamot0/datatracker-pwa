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
import { RefreshCcw } from 'lucide-react';
import { SyncEntryTableRow } from '../pages/viewer-sync-queue/types/sync-entry-table-row';

export type RowSelectOptions = 'None';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  rowSelectOptions?: RowSelectOptions;
  optionalButtons?: React.ReactNode;
  callback: (row: SyncEntryTableRow[]) => void;
  direction: 'Local' | 'Remote';
}

export function ReliabilityDataTable<TData, TValue>({
  columns,
  data,
  optionalButtons,
  callback,
  rowSelectOptions = 'None',
  direction,
}: DataTableProps<TData, TValue>) {
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
              //@ts-ignore
              callback(table.getFilteredSelectedRowModel().rows.map((row) => row.original));

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
              {headerGroup.headers.map((header, index) => {
                return (
                  <TableHead
                    key={header.id}
                    className={cn('', {
                      'w-full': index > 0,
                      'max-w-10': index === 0,
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
                {row.getVisibleCells().map((cell) => (
                  <TableCell className="" key={cell.id}>
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
      <DataTablePagination table={table} rowSelectOptions={rowSelectOptions} />
    </div>
  );
}
