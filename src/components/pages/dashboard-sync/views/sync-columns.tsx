import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { SyncEntryTableRow, SyncFileType } from '@/types/sync';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function typeToString(fileType: SyncFileType) {
  switch (fileType) {
    case 'keyset':
      return 'KeySet';
    case 'session_parameters':
      return 'Session Parameters';
    case 'session_outcome':
      return 'Session Outcome';
    default:
      return 'Unknown';
  }
}

/**
 * Column definitions for the sync tables.
 */
export const syncColumns: ColumnDef<SyncEntryTableRow>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'group',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Group" />,
  },
  {
    accessorKey: 'individual',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Individual" />,
  },
  {
    accessorKey: 'evaluation',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Evaluation" />,
    cell: ({ getValue }) => {
      const value = getValue() as string;
      if (/\.[a-zA-Z0-9]+$/.test(value)) return null;
      return value;
    },
  },
  {
    accessorKey: 'condition',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Condition" />,
    cell: ({ getValue }) => {
      const value = getValue() as string;
      if (!value) return null;
      return value;
    },
  },
  {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ getValue }) => {
      const value = getValue() as string;
      const label = typeToString(value as SyncFileType);

      if (/\.[a-zA-Z0-9]+$/.test(value)) return null;
      return (
        <Badge
          className={cn('', {
            'bg-blue-600 hover:bg-blue-400': value === 'keyset',
            'bg-teal-600 hover:bg-teal-400': value === 'session_parameters',
            'bg-amber-600 hover:bg-amber-400': value === 'session_outcome',
          })}
        >
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'file',
    header: ({ column }) => <DataTableColumnHeader column={column} title="File Path" />,
  },
];
