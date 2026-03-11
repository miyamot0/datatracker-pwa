import PageWrapper from '@/components/layout/page-wrapper';
import { ErrorDisplay } from '@/components/suspense/error-display';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import BackButton from '@/components/ui/back-button';
import { BuildGroupBreadcrumb, BuildIndividualsBreadcrumb } from '@/components/ui/breadcrumb-entries';
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
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import { FolderHandleContextType } from '@/context/folder-context';
import { queryClient } from '@/context/query-client';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { mutationEvaluations } from '@/queries/evaluations/mutate-evaluations';
import { fetchEvaluations } from '@/queries/evaluations/query-evaluations';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ColumnDef, Row } from '@tanstack/react-table';
import {
  ChartColumnIcon,
  ChevronDown,
  Copy,
  Disc3,
  Edit2,
  FilePlus,
  ImportIcon,
  KeyboardIcon,
  ScatterChartIcon,
  SearchIcon,
  Table2Icon,
} from 'lucide-react';
import { Link, redirect, useLoaderData } from 'react-router-dom';
import { toast } from 'sonner';

type LoaderResult = {
  Group: string;
  Individual: string;
  Handle: FileSystemDirectoryHandle;
  Context: FolderHandleContextType;
};

// eslint-disable-next-line react-refresh/only-export-components
export const evaluationsPageLoader = (ctx: FolderHandleContextType) => {
  const { handle } = ctx;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async ({ params }: any) => {
    const { Group, Individual } = params;

    if (!Group || !Individual || !handle) {
      const response = redirect(createHref({ type: 'Dashboard' }));
      throw response;
    }

    return {
      Group: CleanUpString(Group),
      Individual: CleanUpString(Individual),
      Handle: handle,
      Context: ctx,
    } satisfies LoaderResult;
  };
};

type EvaluationTableRow = {
  Evaluation: string;
};

export default function EvaluationsPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Context } = loaderResult;
  const { settings } = Context;

  const { data, isLoading, error } = useQuery({
    queryKey: ['/', Group, Individual],
    queryFn: () => fetchEvaluations({ Context, Group, Individual }),
  });

  const mutateEvaluations = useMutation({
    mutationFn: mutationEvaluations,
    onSuccess: (data) => {
      queryClient.setQueryData(['/', Group, Individual], data);
    },
  });

  if (isLoading) return <LoadingDisplay />;

  if (error || data == undefined) return <ErrorDisplay Text={'An error occurred while fetching evaluations.'} />;

  const DynamicButtonList = ({ row }: { row: Row<EvaluationTableRow> }) => {
    return (
      <Button size={'sm'} variant={'outline'} className="flex flex-row divide-x justify-between mx-0 px-0 shadow">
        <Link
          unstable_viewTransition
          className="px-3 hover:underline flex flex-row items-center"
          to={createHref({
            type: 'Session Designer',
            group: Group,
            individual: Individual,
            evaluation: row.original.Evaluation,
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
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link
                unstable_viewTransition
                className="flex flex-row items-center"
                to={createHref({
                  type: 'Evaluation Session Viewer',
                  group: Group,
                  individual: Individual,
                  evaluation: row.original.Evaluation,
                })}
              >
                <SearchIcon className="mr-2 h-4 w-4" />
                Review Session Data
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
                  evaluation: row.original.Evaluation,
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
                  evaluation: row.original.Evaluation,
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
                  evaluation: row.original.Evaluation,
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
                  evaluation: row.original.Evaluation,
                })}
              >
                <ChartColumnIcon className="mr-2 h-4 w-4" />
                Calculate Reliability
              </Link>
            </DropdownMenuItem>
            {settings.EnableFileDeletion && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    const new_evaluation_name = window.prompt(
                      'Enter the name for the duplicated evaluation:',
                      `${row.original.Evaluation}_Copy`,
                    );

                    if (!new_evaluation_name) return;

                    if (new_evaluation_name.trim().length < 4) return;

                    toast.promise(
                      async () =>
                        await mutateEvaluations.mutateAsync({
                          Group,
                          Individual,
                          Evaluations: [row.original.Evaluation],
                          Rename: new_evaluation_name,
                          Context,
                          Action: 'Duplicate',
                        }),
                      {
                        loading: 'Duplicating existing evaluation...',
                        success: () => {
                          return 'Evaluation folders have been created successfully!';
                        },
                        error: () => {
                          return 'An error occurred while creating evaluation folders.';
                        },
                      },
                    );
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Evaluation
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const new_evaluation_name = window.prompt(
                      'Enter a new name for the evaluation:',
                      `${row.original.Evaluation}`,
                    );

                    if (!new_evaluation_name) return;

                    if (new_evaluation_name.trim().length < 4) return;

                    toast.promise(
                      async () =>
                        await mutateEvaluations.mutateAsync({
                          Group,
                          Individual,
                          Evaluations: [row.original.Evaluation],
                          Rename: new_evaluation_name,
                          Context,
                          Action: 'Rename',
                        }),
                      {
                        loading: 'Renaming existing evaluation...',
                        success: () => {
                          return 'Evaluation folders have been renamed successfully!';
                        },
                        error: () => {
                          return 'An error occurred while renaming evaluation folders.';
                        },
                      },
                    );
                  }}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Rename Evaluation
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </Button>
    );
  };

  const columns: ColumnDef<EvaluationTableRow>[] = [
    {
      accessorKey: 'Evaluation',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Evaluation" />,
    },
    {
      accessorKey: 'Actions',
      header: () => <div className="text-right">Evaluation Folder Actions</div>,
      cell: ({ row }) => (
        <div className="flex flex-row justify-end">
          <DynamicButtonList row={row} />
        </div>
      ),
    },
  ];

  return (
    <PageWrapper
      breadcrumbs={[BuildGroupBreadcrumb(), BuildIndividualsBreadcrumb(Group)]}
      label={CleanUpString(Individual)}
      className="select-none"
    >
      <Card className="w-full max-w-screen-2xl">
        <CardHeader className="flex flex-col md:flex-row w-full justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Evaluation Directory: {Individual}</CardTitle>
            <CardDescription>Select Evaluation to Build Session</CardDescription>
          </div>
          <div className="flex flex-row gap-2">
            <BackButton Label="Back to Clients" Href={createHref({ type: 'Individuals', group: Group })} />
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
          <p>
            This page provides a list of all evaluations for the respective individual. You may review individual data,
            visualize data over time, or calculate measures of reliability by selecting the relevant action for each
            evaluation (i.e., the 'down' arrow). You must have at least <i>one</i> evaluation to begin recording client
            data.
          </p>

          <DataTable
            settings={settings}
            columns={columns}
            data={data.map((g) => {
              return { Evaluation: g };
            })}
            callback={(rows) => {
              const evaluationNames = rows.map((row) => row.Evaluation);

              const confirm_delete = window.confirm(
                `Are you sure you want to delete ${evaluationNames.length} evaluations? This CANNOT be undone.`,
              );

              if (!confirm_delete) return;

              toast.promise(
                async () =>
                  await mutateEvaluations.mutateAsync({
                    Group,
                    Individual,
                    Evaluations: evaluationNames,
                    Context,
                    Action: 'Delete',
                  }),
                {
                  loading: 'Deleting evaluation folders...',
                  success: () => {
                    return 'Evaluation folders have been deleted successfully!';
                  },
                  error: () => {
                    return 'An error occurred while deleting evaluation folders.';
                  },
                },
              );
            }}
            filterCol="Evaluation"
            optionalButtons={
              <div className="flex flex-row gap-2">
                <ToolTipWrapper Label="Add an a new evaluation for current individual">
                  <Button
                    variant={'outline'}
                    size={'sm'}
                    className="shadow"
                    onClick={async () => {
                      const input = window.prompt('Enter a name for the new evaluation.');

                      if (!input) return;

                      if (data.includes(input.trim())) {
                        alert('Evaluation already exists.');
                        return;
                      }

                      if (input.trim().length < 4) {
                        alert('Evaluation name must be at least 4 characters long.');
                        return;
                      }

                      toast.promise(
                        async () =>
                          await mutateEvaluations.mutateAsync({
                            Group,
                            Individual,
                            Evaluations: [input.trim()],
                            Context,
                            Action: 'Add',
                          }),
                        {
                          loading: 'Creating evaluation folders...',
                          success: () => {
                            return 'Evaluation folders have been created successfully!';
                          },
                          error: () => {
                            return 'An error occurred while creating the evaluation folder.';
                          },
                        },
                      );
                    }}
                  >
                    <FilePlus className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                </ToolTipWrapper>
                <Link
                  unstable_viewTransition
                  to={createHref({
                    type: 'Evaluations Import',
                    group: Group,
                    individual: Individual,
                  })}
                >
                  <ToolTipWrapper Label="Import an existing evaluation for the current individual">
                    <Button variant={'outline'} className="shadow" size={'sm'}>
                      <ImportIcon className="w-4 h-4 mr-2" />
                      Import
                    </Button>
                  </ToolTipWrapper>
                </Link>
                <Link
                  unstable_viewTransition
                  to={createHref({
                    type: 'Keysets',
                    group: Group,
                    individual: Individual,
                  })}
                >
                  <ToolTipWrapper Label="Manage KeySets across evaluations">
                    <Button variant={'outline'} className="shadow" size={'sm'}>
                      <KeyboardIcon className="w-4 h-4 mr-2" />
                      KeySets
                    </Button>
                  </ToolTipWrapper>
                </Link>
              </div>
            }
          />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
