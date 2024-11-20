import PageWrapper from '@/components/layout/page-wrapper';
import { BuildGroupBreadcrumb } from '@/components/ui/breadcrumb-entries';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LoadingDisplay from '@/components/ui/loading-display';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '@/components/ui/table';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import { FolderHandleContext } from '@/context/folder-context';
import useQueryClients from '@/hooks/clients/useQueryClients';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { cn } from '@/lib/utils';
import { ChevronDown, FolderInput, FolderPlus, FolderX } from 'lucide-react';
import { useContext } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function ClientsPage() {
  const { settings } = useContext(FolderHandleContext);
  const { Group } = useParams();
  const navigate = useNavigate();

  const { data, status, error, handle, addClient, removeClient } = useQueryClients(Group);

  if (!handle || !Group) {
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

  return (
    <PageWrapper breadcrumbs={[BuildGroupBreadcrumb()]} label={CleanUpString(Group)} className="select-none">
      <Card className="w-full max-w-screen-2xl">
        <CardHeader className="flex flex-col md:flex-row w-full justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Client Directory: {CleanUpString(Group)}</CardTitle>
            <CardDescription>Select clients to develop and evaluate outcomes</CardDescription>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <ToolTipWrapper Label="Add a new client to current group">
              <Button
                variant={'outline'}
                className="shadow"
                onClick={async () => {
                  await addClient();
                }}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Create Individual
              </Button>
            </ToolTipWrapper>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-1.5">
          <p>
            Each of the entries in the table below represent individual clients. You must have at least <i>one</i>{' '}
            client added to the group before you can begin collecting data (e.g., designing evaluations, adding
            conditions in evaluations).
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Names</TableHead>
                <TableHead className="text-right">Client Folder Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((id, index) => (
                <TableRow key={index} className="my-2">
                  <TableCell>{id}</TableCell>
                  <TableCell className="flex flex-row justify-end">
                    <Button
                      size={'sm'}
                      variant={'outline'}
                      className="flex flex-row divide-x justify-between mx-0 px-0 shadow"
                    >
                      <Link
                        unstable_viewTransition
                        className="px-3 hover:underline flex flex-row items-center"
                        to={createHref({
                          type: 'Evaluations',
                          group: Group,
                          individual: id,
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
                                disabled: settings.EnableFileDeletion === false,
                                'pointer-events-none': settings.EnableFileDeletion === false,
                              }
                            )}
                            disabled={settings.EnableFileDeletion === false}
                            onClick={async () => {
                              await removeClient(id);
                            }}
                          >
                            <FolderX className="mr-2 h-4 w-4" />
                            Delete ALL Client Data
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
