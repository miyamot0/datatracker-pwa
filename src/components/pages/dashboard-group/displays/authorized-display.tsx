import BackButton from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import createHref from '@/lib/links';
import { ChevronDown, FolderInput, FolderPlus, FolderX } from 'lucide-react';
import { DataTable } from '../../../ui/data-table-common';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { ColumnDef } from '@tanstack/react-table';
import { FolderHandleContext } from '@/context/folder-context';
import { useContext } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  Groups: string[];
  AddGroup: () => void;
  RemoveGroup: (group: string) => void;
};

type GroupTableRow = {
  Group: string;
};

export default function AuthorizedDisplay({ Groups, AddGroup, RemoveGroup }: Props) {
  const { settings } = useContext(FolderHandleContext);

  const columns: ColumnDef<GroupTableRow>[] = [
    {
      accessorKey: 'Group',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Client Group Folder" />,
    },
    {
      accessorKey: 'Actions',

      header: () => <div className="text-right">Group Folder Actions</div>,
      cell: ({ row }) => (
        <div className="flex flex-row justify-end">
          <Button size={'sm'} variant={'outline'} className="flex flex-row divide-x justify-between mx-0 px-0 shadow">
            <Link
              unstable_viewTransition
              className="px-3 hover:underline flex flex-row items-center"
              to={createHref({ type: 'Individuals', group: row.original.Group })}
            >
              <FolderInput className="mr-2 h-4 w-4" />
              Open Group
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ChevronDown className="w-fit px-2" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" side="bottom" align="end" sideOffset={12}>
                <DropdownMenuLabel>Data Management</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className={cn(
                    'bg-red-500 text-white hover:bg-red-400 focus:bg-red-400 focus:text-white rounded cursor-pointer',
                    {
                      disabled: settings.EnableFileDeletion === false,
                      'pointer-events-none': settings.EnableFileDeletion === false,
                    }
                  )}
                  disabled={settings.EnableFileDeletion === false}
                  onClick={async () => {
                    await RemoveGroup(row.original.Group);
                  }}
                >
                  <FolderX className="mr-2 h-4 w-4" />
                  Delete Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="w-full max-w-screen-2xl">
      <CardHeader className="flex flex-col md:flex-row w-full justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Directory of Client Groups</CardTitle>
          <CardDescription>Open Group to Load Relevant Client Data</CardDescription>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <BackButton Label="Back to Home" Href={createHref({ type: 'Home' })} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-1.5">
        <p>
          Each entry in this page represents a 'Grouping' of individuals. The specific grouping does not change any
          functionality provided; however, this helps with organizing the collection and review of data. You must have
          at least <i>one</i> group to begin collecting data.
        </p>

        <DataTable
          columns={columns}
          data={Groups.map((g) => {
            return { Group: g };
          })}
          filterCol="Group"
          optionalButtons={
            <Button
              variant={'outline'}
              size={'sm'}
              className="shadow"
              onClick={async () => {
                await AddGroup();
              }}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}
