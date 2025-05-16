import BackButton from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '@/components/ui/table';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import { FolderHandleContext } from '@/context/folder-context';
import createHref from '@/lib/links';
import { cn } from '@/lib/utils';
import { ChevronDown, FolderInput, FolderPlus, FolderX } from 'lucide-react';
import { useContext } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  Groups: string[];
  AddGroup: () => void;
  RemoveGroup: (group: string) => void;
};

export default function AuthorizedDisplay({ Groups, AddGroup, RemoveGroup }: Props) {
  const { settings } = useContext(FolderHandleContext);

  return (
    <Card className="w-full max-w-screen-2xl">
      <CardHeader className="flex flex-col md:flex-row w-full justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Directory of Client Groups</CardTitle>
          <CardDescription>Select group to load relevant client data</CardDescription>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <ToolTipWrapper Label="Create a new group folder">
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
          </ToolTipWrapper>

          <BackButton Label="Back" />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-1.5">
        <p>
          Each entry in this page represents a 'Grouping' of individuals. The specific grouping does not change any
          functionality provided; however, this helps with organizing the collection and review of data. You must have
          at least <i>one</i> group to begin collecting data.
        </p>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Group Folder</TableHead>
              <TableHead className="text-right">Group Folder Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Groups.map((group, index) => (
              <TableRow key={index} className="my-2">
                <TableCell>{group}</TableCell>
                <TableCell className="flex flex-row justify-end">
                  <Button
                    size={'sm'}
                    variant={'outline'}
                    className="flex flex-row divide-x justify-between mx-0 px-0 shadow"
                  >
                    <Link
                      unstable_viewTransition
                      className="px-3 hover:underline flex flex-row items-center"
                      to={createHref({ type: 'Individuals', group })}
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
                            await RemoveGroup(group);
                          }}
                        >
                          <FolderX className="mr-2 h-4 w-4" />
                          Delete Group
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
  );
}
