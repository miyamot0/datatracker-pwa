import PageWrapper from '@/components/layout/page-wrapper';
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
import LoadingDisplay from '@/components/ui/loading-display';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import { FolderHandleContextType } from '@/context/folder-context';
import { useQueryEvaluationsFixed } from '@/hooks/evaluations/useQueryEvaluations';
import { GetHandleEvaluationFolder } from '@/lib/files';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
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
  const { Group, Individual, Context, Handle } = loaderResult;
  const { settings } = Context;
  const { data, status, error, addEvaluation, removeEvaluations, mutateEvaluation, refresh } = useQueryEvaluationsFixed(
    Group,
    Individual,
    Context,
  );

  if (status === 'loading') {
    return <LoadingDisplay />;
  }

  if (error) {
    return <div>{error}</div>;
  }

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
                    const duplicate_action = async () => {
                      const new_evaluation_name = window.prompt(
                        'Enter the name for the duplicated evaluation:',
                        `${row.original.Evaluation}_Copy`,
                      );

                      if (!new_evaluation_name) return;

                      const group_dir = await Handle.getDirectoryHandle(CleanUpString(Group));
                      const client_dir = await group_dir.getDirectoryHandle(CleanUpString(Individual));
                      const new_eval_dir = await client_dir.getDirectoryHandle(new_evaluation_name, { create: true });
                      const old_eval_dir = await GetHandleEvaluationFolder(
                        Handle,
                        Group,
                        Individual,
                        row.original.Evaluation,
                      );

                      for await (const entry of old_eval_dir.values()) {
                        if (entry.kind === 'directory') {
                          const old_eval_sub_dir = await old_eval_dir.getDirectoryHandle(entry.name, { create: false });
                          const new_eval_sub_dir = await new_eval_dir.getDirectoryHandle(entry.name, { create: true });

                          const child_files = entry.values();

                          for await (const child_entry of child_files) {
                            if (child_entry.kind === 'file') {
                              const og_file_handle = await old_eval_sub_dir.getFileHandle(child_entry.name);
                              const og_file_data = await og_file_handle.getFile();

                              const new_file_handle = await new_eval_sub_dir.getFileHandle(child_entry.name, {
                                create: true,
                              });
                              const writable = await new_file_handle.createWritable();
                              await writable.write(og_file_data);
                              await writable.close();
                            }
                          }
                        }
                      }

                      refresh();
                    };

                    toast.promise(async () => await duplicate_action(), {
                      loading: 'Duplicating existing evaluation...',
                      success: () => {
                        return 'Evaluation folders have been created successfully!';
                      },
                      error: () => {
                        return 'An error occurred while creating evaluation folders.';
                      },
                    });
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Evaluation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => mutateEvaluation(row.original.Evaluation)}>
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

              toast.promise(async () => await removeEvaluations(evaluationNames), {
                loading: 'Deleting evaluation folders...',
                success: () => {
                  return 'Evaluation folders have been deleted successfully!';
                },
                error: () => {
                  return 'An error occurred while deleting evaluation folders.';
                },
              });
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
                      await addEvaluation();
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
