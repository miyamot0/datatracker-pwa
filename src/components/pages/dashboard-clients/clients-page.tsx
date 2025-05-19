import PageWrapper from '@/components/layout/page-wrapper';
import BackButton from '@/components/ui/back-button';
import { BuildGroupBreadcrumb } from '@/components/ui/breadcrumb-entries';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTable } from '@/components/ui/data-table-common';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LoadingDisplay from '@/components/ui/loading-display';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import { FolderHandleContextType } from '@/context/folder-context';
import useQueryClients from '@/hooks/clients/useQueryClients';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { cn } from '@/lib/utils';
import { ApplicationSettingsTypes } from '@/types/settings';
import { ColumnDef } from '@tanstack/react-table';
import { ChevronDown, FolderInput, FolderPlus, FolderX } from 'lucide-react';
import { Link, redirect, useLoaderData, useNavigate } from 'react-router-dom';

type LoaderResult = {
  Group: string;
  Handle: FileSystemHandle;
  Settings: ApplicationSettingsTypes;
};

export const clientsPageLoader = (ctx: FolderHandleContextType) => {
  const { handle } = ctx;

  // @ts-ignore
  return async ({ params, request }) => {
    const { Group } = params;

    if (!Group || !handle) {
      const response = redirect(createHref({ type: 'Dashboard' }));
      throw response;
    }

    return {
      Group: CleanUpString(Group!),
      Handle: handle,
      Settings: ctx.settings,
    } satisfies LoaderResult;
  };
};

type ClientTableRow = {
  Individual: string;
};

export default function ClientsPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Settings } = loaderResult;

  const navigate = useNavigate();

  // TODO: Hooks are nice, but might just be cleaner with loaders

  const { data, status, error, handle, addClient, removeClient } = useQueryClients(Group);

  if (!handle) {
    navigate(createHref({ type: 'Dashboard' }), {
      unstable_viewTransition: true,
    });

    return <></>;
  }

  if (status === 'loading') {
    return <LoadingDisplay />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const columns: ColumnDef<ClientTableRow>[] = [
    {
      accessorKey: 'Individual',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Client Name/ID" />,
    },
    {
      accessorKey: 'Actions',

      header: () => <div className="text-right">Client Folder Actions</div>,
      cell: ({ row }) => (
        <div className="flex flex-row justify-end">
          <Button size={'sm'} variant={'outline'} className="flex flex-row divide-x justify-between mx-0 px-0 shadow">
            <Link
              unstable_viewTransition
              className="px-3 hover:underline flex flex-row items-center"
              to={createHref({
                type: 'Evaluations',
                group: Group,
                individual: row.original.Individual,
              })}
            >
              <FolderInput className="mr-2 h-4 w-4" />
              Open Evaluations
            </Link>
            <DropdownMenu modal={false}>
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
                      disabled: Settings.EnableFileDeletion === false,
                      'pointer-events-none': Settings.EnableFileDeletion === false,
                    }
                  )}
                  disabled={Settings.EnableFileDeletion === false}
                  onClick={async () => {
                    await removeClient(row.original.Individual);
                  }}
                >
                  <FolderX className="mr-2 h-4 w-4" />
                  Delete ALL Client Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageWrapper breadcrumbs={[BuildGroupBreadcrumb()]} label={CleanUpString(Group)} className="select-none">
      <Card className="w-full max-w-screen-2xl">
        <CardHeader className="flex flex-col md:flex-row w-full justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Client Directory: {CleanUpString(Group)}</CardTitle>
            <CardDescription>Select clients to develop and evaluate outcomes</CardDescription>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <BackButton Label="Back to Groups" Href={createHref({ type: 'Dashboard' })} />
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-1.5">
          <p>
            Each of the entries in the table below represent individual clients. You must have at least <i>one</i>{' '}
            client added to the group before you can begin collecting data (e.g., designing evaluations, adding
            conditions in evaluations).
          </p>

          <DataTable
            columns={columns}
            data={data.map((g) => {
              return { Individual: g };
            })}
            filterCol="Individual"
            optionalButtons={
              <ToolTipWrapper Label="Add a new client to current group">
                <Button
                  variant={'outline'}
                  className="shadow"
                  size={'sm'}
                  onClick={async () => {
                    await addClient();
                  }}
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Create
                </Button>
              </ToolTipWrapper>
            }
          />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
