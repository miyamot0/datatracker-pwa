import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { SyncEntryTableRow } from '@/types/sync';

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
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
  },
  {
    accessorKey: 'file',
    header: ({ column }) => <DataTableColumnHeader column={column} title="File Path" />,
  },
];
