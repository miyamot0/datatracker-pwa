import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type DataTableProps = {
  headings: string[];
  rows: string[][];
  className?: string;
};

// Read-only, unsorted, no editing: a plain <table> with a sticky first column.
export function DataTable({ headings, rows, className }: DataTableProps) {
  return (
    <Table className={cn('w-max min-w-full select-text', className)}>
      <TableHeader>
        <TableRow>
          {headings.map((heading, i) => (
            <TableHead
              key={i}
              scope="col"
              className={cn('whitespace-nowrap', i === 0 && 'sticky left-0 z-10')}
            >
              {heading}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, rowIndex) => (
          <TableRow key={rowIndex} className="group hover:bg-muted/50">
            {row.map((cell, cellIndex) => (
              <TableCell
                key={cellIndex}
                className={cn(
                  'whitespace-nowrap',
                  cellIndex === 0 && 'sticky left-0 z-10 group-hover:bg-muted'
                )}
              >
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default DataTable;
