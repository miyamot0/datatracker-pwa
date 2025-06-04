import BackButton from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import createHref from '@/lib/links';
import { DatabaseIcon, FolderInput, FolderPlus } from 'lucide-react';
import { DataTable } from '../../../ui/data-table-common';
import { Link } from 'react-router-dom';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { ColumnDef } from '@tanstack/react-table';
import { FolderHandleContext } from '@/context/folder-context';
import { useContext } from 'react';
import { toast } from 'sonner';

type Props = {
  Groups: string[];
  AddGroup: () => void;
  RemoveGroups: (group: string[]) => void;
  AddExamples: () => void;
};

type GroupTableRow = {
  Group: string;
};

export default function AuthorizedDisplay({ Groups, AddGroup, RemoveGroups, AddExamples }: Props) {
  const { settings } = useContext(FolderHandleContext);

  const columns: ColumnDef<GroupTableRow>[] = [
    {
      accessorKey: 'Group',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Client Group Folder" />,
    },
    {
      accessorKey: 'Actions',
      header: () => <div className="text-right whitespace-nowrap">Group Folder Actions</div>,
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
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="w-full max-w-screen-2xl">
      <CardHeader className="flex flex-col md:flex-row w-full justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Directory of Groups</CardTitle>
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
          settings={settings}
          columns={columns}
          data={Groups.map((g) => {
            return { Group: g };
          })}
          callback={(rows) => {
            const groupNames = rows.map((row) => row.Group);
            toast.promise(async () => await RemoveGroups(groupNames), {
              loading: 'Deleting group folders...',
              success: () => {
                return 'Group folders have been deleted successfully!';
              },
              error: () => {
                return 'An error occurred while deleting group folders.';
              },
            });
          }}
          filterCol="Group"
          optionalButtons={
            <>
              <Button
                variant={'outline'}
                size={'sm'}
                className="shadow"
                onClick={async () => {
                  toast.promise(async () => await AddExamples(), {
                    loading: 'Writing example data to disk...',
                    success: () => {
                      return 'Example data has been added! Create a separate "DataTracker" folder elsewhere on your disk to explore "Sync" functionality';
                    },
                    error: () => {
                      return 'Files were not written to disk.';
                    },
                  });
                }}
              >
                <DatabaseIcon className="mr-2 h-4 w-4" />
                Extract Example Folder
              </Button>

              <Button
                variant={'outline'}
                size={'sm'}
                className="shadow"
                onClick={async () => {
                  await AddGroup();
                }}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Create
              </Button>
            </>
          }
        />
      </CardContent>
    </Card>
  );
}
