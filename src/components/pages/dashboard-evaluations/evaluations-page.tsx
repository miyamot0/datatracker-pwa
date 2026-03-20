import { queryClient } from '@/App';
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
import { mutationEvaluations } from '@/queries/evaluations/mutate-evaluations';
import { useMutation } from '@tanstack/react-query';
import { Link, useRouter, useRouterState } from '@tanstack/react-router';
import { ColumnDef, Row } from '@tanstack/react-table';
import {
  ChartColumnIcon,
  ChevronDown,
  Copy,
  Disc3,
  Edit2Icon,
  FilePlus,
  ImportIcon,
  KeyboardIcon,
  ScatterChartIcon,
  SearchIcon,
  Table2Icon,
} from 'lucide-react';
import { toast } from 'sonner';
import BackButton from '../../ui/back-button';
import { ApplicationSettingsTypes } from '@/types/settings';

type EvaluationTableRow = {
  Evaluation: string;
};

export default function EvaluationsPage({
  Group,
  Individual,
  Evaluations,
  Settings,
  Handle,
}: {
  Group: string;
  Individual: string;
  Evaluations: string[];
  Settings: ApplicationSettingsTypes;
  Handle: FileSystemDirectoryHandle;
}) {
  const router = useRouter();
  const routerState = useRouterState();
  const currentRouteId = routerState.matches[routerState.matches.length - 1]?.routeId;

  const mutateEvaluations = useMutation({
    mutationFn: mutationEvaluations,
    onSuccess: async (data) => {
      queryClient.setQueryData(['/', Group, Individual], data);

      await queryClient.invalidateQueries({ queryKey: ['/', 'metaEvaluations'] });
      await router.invalidate({
        filter: (match) => match.routeId === currentRouteId || match.routeId === '/session/$group/$individual/import',
        sync: true,
      });
    },
  });

  const DynamicButtonList = ({ row }: { row: Row<EvaluationTableRow> }) => {
    return (
      <Button size={'sm'} variant={'outline'} className="flex flex-row divide-x justify-between mx-0 px-0 shadow">
        <Link
          className="px-3 hover:underline flex flex-row items-center"
          to="/session/$group/$individual/$evaluation"
          params={{
            group: Group,
            individual: Individual,
            evaluation: row.original.Evaluation,
          }}
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
                className="flex flex-row items-center"
                to="/session/$group/$individual/$evaluation/history"
                params={{
                  group: Group,
                  individual: Individual,
                  evaluation: row.original.Evaluation,
                }}
              >
                <SearchIcon className="mr-2 h-4 w-4" />
                Review Session Data
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                className="flex flex-row items-center"
                to="/session/$group/$individual/$evaluation/view"
                params={{
                  group: Group,
                  individual: Individual,
                  evaluation: row.original.Evaluation,
                }}
              >
                <Table2Icon className="mr-2 h-4 w-4" />
                Summarize Session Data
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                className="flex flex-row items-center"
                to="/session/$group/$individual/$evaluation/rate"
                params={{
                  group: Group,
                  individual: Individual,
                  evaluation: row.original.Evaluation,
                }}
              >
                <ScatterChartIcon className="mr-2 h-4 w-4" />
                Analyze Frequency Data
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                className="flex flex-row items-center"
                to="/session/$group/$individual/$evaluation/proportion"
                params={{
                  group: Group,
                  individual: Individual,
                  evaluation: row.original.Evaluation,
                }}
              >
                <ScatterChartIcon className="mr-2 h-4 w-4" />
                Analyze Duration Data
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                className="flex flex-row items-center"
                to="/session/$group/$individual/$evaluation/reli"
                params={{
                  group: Group,
                  individual: Individual,
                  evaluation: row.original.Evaluation,
                }}
              >
                <ChartColumnIcon className="mr-2 h-4 w-4" />
                Calculate Reliability
              </Link>
            </DropdownMenuItem>
            {Settings.EnableFileDeletion && (
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
                          Handle,
                          Action: 'Duplicate',
                        }),
                      {
                        loading: 'Duplicating existing evaluation...',
                        success: () => {
                          return 'Evaluation folders have been created successfully!';
                        },
                        error: (e: Error) => {
                          return `An error occurred while creating evaluation folders: ${e.message}`;
                        },
                      },
                    );
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Evaluation
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    const new_evaluation_name = window.prompt(
                      'Enter the name for the renamed evaluation:',
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
                          Handle,
                          Action: 'Rename',
                        }),
                      {
                        loading: 'Renaming existing evaluation...',
                        success: () => {
                          return 'Evaluation folders have been renamed successfully!';
                        },
                        error: (e: Error) => {
                          return `An error occurred while renaming evaluation folders: ${e.message}`;
                        },
                      },
                    );
                  }}
                >
                  <Edit2Icon className="mr-2 h-4 w-4" />
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
    <Card className="w-full max-w-screen-2xl">
      <CardHeader className="flex flex-col md:flex-row w-full justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Evaluation Directory: {Individual}</CardTitle>
          <CardDescription>Select Evaluation to Build Session</CardDescription>
        </div>
        <div className="flex flex-row gap-2">
          <BackButton />
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
          settings={Settings}
          columns={columns}
          data={Evaluations.map((g) => {
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
                  Handle,
                  Action: 'Delete',
                }),
              {
                loading: 'Deleting evaluation folders...',
                success: () => {
                  return 'Evaluation folders have been deleted successfully!';
                },
                error: (e: Error) => {
                  return `An error occurred while deleting evaluation folders: ${e.message}`;
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

                    if (Evaluations.includes(input.trim())) {
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
                          Handle,
                          Action: 'Add',
                        }),
                      {
                        loading: 'Creating evaluation folders...',
                        success: () => {
                          return 'Evaluation folders have been created successfully!';
                        },
                        error: (e: Error) => {
                          return `An error occurred while creating the evaluation folder: ${e.message}`;
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
                to={'/session/$group/$individual/import'}
                params={{
                  group: Group,
                  individual: Individual,
                }}
              >
                <ToolTipWrapper Label="Import an existing evaluation for the current individual">
                  <Button variant={'outline'} className="shadow" size={'sm'}>
                    <ImportIcon className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </ToolTipWrapper>
              </Link>

              <Link
                to="/session/$group/$individual/keysets"
                params={{
                  group: Group,
                  individual: Individual,
                }}
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
  );
}
