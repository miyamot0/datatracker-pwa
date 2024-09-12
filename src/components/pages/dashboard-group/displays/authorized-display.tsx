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
import { removeGroupFolder } from '@/lib/files';
import createHref from '@/lib/links';
import { displayConditionalNotification } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { LoadingStructure } from '@/types/working';
import { ChevronDown, FolderInput, FolderPlus, FolderX } from 'lucide-react';
import { Dispatch, SetStateAction, useContext } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  Handle: FileSystemDirectoryHandle;
  Groups: LoadingStructure;
  AddCallback: Dispatch<SetStateAction<LoadingStructure>>;
};

export default function AuthorizedDisplay({ Handle, Groups, AddCallback }: Props) {
  const { settings } = useContext(FolderHandleContext);

  return (
    <Card className="w-full max-w-screen-2xl">
      <CardHeader className="flex flex-col md:flex-row w-full justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Directory of Client Groups</CardTitle>
          <CardDescription>Select group to load relevant client data</CardDescription>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <ToolTipWrapper Label="Create a new group folder">
            <Button
              variant={'outline'}
              className="shadow"
              onClick={async () => {
                const input = window.prompt('Enter a name for the new group.');

                if (!input || !Handle) return;

                if (Groups.Values.includes(input)) {
                  alert('Group already exists.');
                  return;
                }

                if (input.trim().length < 4) {
                  alert('Group name must be at least 4 characters long.');
                  return;
                }

                await Handle.getDirectoryHandle(input, { create: true });

                const new_state = {
                  ...Groups,
                  Values: [...Groups.Values, input],
                };

                AddCallback(new_state);

                displayConditionalNotification(
                  settings,
                  'Folder Created',
                  'The new Group folder has been successfully created.'
                );
              }}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </ToolTipWrapper>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-1.5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Group Folder</TableHead>
              <TableHead className="text-right">Group Folder Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Groups.Values.map((group, index) => (
              <TableRow key={index} className="my-2">
                <TableCell>{group}</TableCell>
                <TableCell className="flex flex-row justify-end">
                  <Button
                    size={'sm'}
                    variant={'outline'}
                    className="flex flex-row divide-x justify-between mx-0 px-0 shadow"
                  >
                    <Link
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
                            const confirm_delete = window.confirm(
                              'Are you sure you want to delete this group?. This CANNOT be undone.'
                            );

                            if (confirm_delete) {
                              try {
                                await removeGroupFolder(Handle, group);

                                const new_state = {
                                  ...Groups,
                                  Values: Groups.Values.filter((item) => item !== group),
                                };

                                AddCallback(new_state);

                                displayConditionalNotification(
                                  settings,
                                  'Group Data Deleted',
                                  'Group data has been successfully deleted.'
                                );
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                              } catch (error: unknown) {
                                displayConditionalNotification(
                                  settings,
                                  'Error Deleting Group Data',
                                  'An error occurred while trying to delete the group folder.',
                                  3000,
                                  true
                                );
                              }
                            }
                          }}
                        >
                          <FolderX className="mr-2 h-4 w-4" />
                          Remove Group
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
