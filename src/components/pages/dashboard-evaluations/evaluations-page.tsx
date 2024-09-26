import PageWrapper from '@/components/layout/page-wrapper';
import { BuildGroupBreadcrumb, BuildIndividualsBreadcrumb } from '@/components/ui/breadcrumb-entries';
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
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '@/components/ui/table';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import { FolderHandleContext } from '@/context/folder-context';
import { getClientEvaluationFolders, removeClientEvaluationFolder } from '@/lib/files';
import createHref from '@/lib/links';
import { displayConditionalNotification } from '@/lib/notifications';
import { CleanUpString } from '@/lib/strings';
import { cn } from '@/lib/utils';
import { LoadingStructure } from '@/types/working';
import {
  ChartColumnIcon,
  ChevronDown,
  Disc3,
  FilePlus,
  FolderX,
  KeyboardIcon,
  ScatterChartIcon,
  SearchIcon,
  Table2Icon,
} from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function EvaluationsPage() {
  const { Group, Individual } = useParams();
  const { settings, handle } = useContext(FolderHandleContext);
  const [evaluations, setEvaluations] = useState<LoadingStructure>({
    Status: 'loading',
    Values: [],
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!handle || !Group || !Individual) {
      navigate(createHref({ type: 'Dashboard' }), {
        unstable_viewTransition: true,
      });
      return;
    }

    getClientEvaluationFolders(handle, Group, Individual, setEvaluations);
  }, [handle, Group, Individual, navigate]);

  if (!Group || !Individual || !handle) {
    throw new Error('Params missing.');
  }

  return (
    <PageWrapper
      breadcrumbs={[BuildGroupBreadcrumb(), BuildIndividualsBreadcrumb(Group)]}
      label={CleanUpString(Individual)}
    >
      <Card className="w-full max-w-screen-2xl">
        <CardHeader className="flex flex-col md:flex-row w-full justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Evaluation Directory: {Individual}</CardTitle>
            <CardDescription>Select Evaluation to Build Session</CardDescription>
          </div>
          <div className="flex flex-row gap-2">
            <ToolTipWrapper Label="Add an a new evaluation for current individual">
              <Button
                variant={'outline'}
                className="shadow"
                onClick={async () => {
                  const input = window.prompt('Enter a name for the new evaluation.');

                  if (!input || !handle) return;

                  if (evaluations.Values.includes(input)) {
                    alert('Evaluation already exists.');
                    return;
                  }

                  if (input.trim().length < 4) {
                    alert('Evaluation name must be at least 4 characters long.');
                    return;
                  }

                  const group_dir = await handle.getDirectoryHandle(CleanUpString(Group));
                  const client_dir = await group_dir.getDirectoryHandle(CleanUpString(Individual));
                  await client_dir.getDirectoryHandle(input, { create: true });

                  const new_state = {
                    ...evaluations,
                    Values: [...evaluations.Values, input],
                  };

                  setEvaluations(new_state);
                }}
              >
                <FilePlus className="w-4 h-4 mr-2" />
                Create Evaluation
              </Button>
            </ToolTipWrapper>
            <Link
              unstable_viewTransition
              to={createHref({
                type: 'Keysets',
                group: Group,
                individual: Individual,
              })}
            >
              <ToolTipWrapper Label="Manage KeySets across evaluations">
                <Button variant={'outline'} className="shadow">
                  <KeyboardIcon className="w-4 h-4 mr-2" />
                  Manage KeySets
                </Button>
              </ToolTipWrapper>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-1.5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Evaluations</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluations.Values.map((evaluation, index) => (
                <TableRow key={index} className="my-2">
                  <TableCell>{evaluation}</TableCell>
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
                          type: 'Session Designer',
                          group: Group,
                          individual: Individual,
                          evaluation,
                        })}
                      >
                        <Disc3 className="mr-2 h-4 w-4" />
                        Record Sessions
                      </Link>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <ChevronDown className="w-fit px-2" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64" side="bottom" align="end" sideOffset={12}>
                          <DropdownMenuLabel>Data Management</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Link
                              unstable_viewTransition
                              className="flex flex-row items-center"
                              to={createHref({
                                type: 'Evaluation Session Viewer',
                                group: Group,
                                individual: Individual,
                                evaluation,
                              })}
                            >
                              <SearchIcon className="mr-2 h-4 w-4" />
                              Inspect Session Data
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link
                              unstable_viewTransition
                              className="flex flex-row items-center"
                              to={createHref({
                                type: 'Evaluation Viewer',
                                group: Group,
                                individual: Individual,
                                evaluation,
                              })}
                            >
                              <Table2Icon className="mr-2 h-4 w-4" />
                              Summarize Session Data
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link
                              unstable_viewTransition
                              className="flex flex-row items-center"
                              to={createHref({
                                type: 'Evaluation Visualizer-Rate',
                                group: Group,
                                individual: Individual,
                                evaluation,
                              })}
                            >
                              <ScatterChartIcon className="mr-2 h-4 w-4" />
                              Analyze Frequency Data
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link
                              unstable_viewTransition
                              className="flex flex-row items-center"
                              to={createHref({
                                type: 'Evaluation Visualizer-Proportion',
                                group: Group,
                                individual: Individual,
                                evaluation,
                              })}
                            >
                              <ScatterChartIcon className="mr-2 h-4 w-4" />
                              Analyze Duration Data
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link
                              unstable_viewTransition
                              className="flex flex-row items-center"
                              to={createHref({
                                type: 'Reli Viewer',
                                group: Group,
                                individual: Individual,
                                evaluation,
                              })}
                            >
                              <ChartColumnIcon className="mr-2 h-4 w-4" />
                              Calculate Reliability
                            </Link>
                          </DropdownMenuItem>
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
                                'Are you sure you want to delete this evaluation?. This CANNOT be undone.'
                              );

                              if (confirm_delete) {
                                try {
                                  await removeClientEvaluationFolder(handle, Group, Individual, evaluation);

                                  const new_state = {
                                    ...evaluations,
                                    Values: evaluations.Values.filter((item) => item !== evaluation),
                                  };

                                  setEvaluations(new_state);

                                  displayConditionalNotification(
                                    settings,
                                    'Evaluation Data Deleted',
                                    'Evaluation data has been successfully deleted.'
                                  );
                                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                } catch (error) {
                                  displayConditionalNotification(
                                    settings,
                                    'Evaluation Data Deletion Error',
                                    'An error occurred while deleting the evaluation data.',
                                    3000,
                                    true
                                  );
                                }
                              }
                            }}
                          >
                            <FolderX className="mr-2 h-4 w-4" />
                            Remove Evaluation
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
