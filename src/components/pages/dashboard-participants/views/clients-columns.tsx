import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { ApplicationSettingsTypes } from '@/types/settings/application-settings';
import { ColumnDef } from '@tanstack/react-table';
import ClientRowActions from './client-row-actions';

export type ClientTableRow = {
  Individual: string;
};

type BuildClientColumnsArgs = {
  Group: string;
  Clients: string[];
  Handle: FileSystemDirectoryHandle;
  Settings: ApplicationSettingsTypes;
};

export function buildClientColumns({
  Group,
  Clients,
  Handle,
  Settings,
}: BuildClientColumnsArgs): ColumnDef<ClientTableRow>[] {
  return [
    {
      accessorKey: 'Individual',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Client Name/ID" />,
    },
    {
      accessorKey: 'Actions',
      header: () => <div className="text-right">Client Folder Actions</div>,
      cell: ({ row }) => (
        <div className="flex flex-row justify-end">
          <ClientRowActions
            Group={Group}
            Individual={row.original.Individual}
            Clients={Clients}
            Handle={Handle}
            Settings={Settings}
          />
        </div>
      ),
    },
  ];
}
