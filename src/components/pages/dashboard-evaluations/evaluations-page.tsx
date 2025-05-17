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
import { FolderHandleContext } from '@/context/folder-context';
import useQueryEvaluations from '@/hooks/evaluations/useQueryEvaluations';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import {
  ChartColumnIcon,
  ChevronDown,
  Disc3,
  FilePlus,
  FolderX,
  ImportIcon,
  KeyboardIcon,
  ScatterChartIcon,
  SearchIcon,
  Table2Icon,
} from 'lucide-react';
import { useContext } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

type EvaluationTableRow = {
  Evaluation: string;
};

export default function EvaluationsPage() {
  const { Group, Individual } = useParams();
  const { settings } = useContext(FolderHandleContext);
  const { data, status, error, handle, addEvaluation, removeEvaluation } = useQueryEvaluations(Group, Individual);

  const navigate = useNavigate();

  if (!handle || !Group || !Individual) {
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

  const columns: ColumnDef<EvaluationTableRow>[] = [
    {
      accessorKey: 'Evaluation',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Evaluation" />,
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
                    await removeEvaluation(row.original.Evaluation);
                  }}
                >
                  <FolderX className="mr-2 h-4 w-4" />
                  Delete ALL Evaluation Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Button>
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
            columns={columns}
            data={data.map((g) => {
              return { Evaluation: g };
            })}
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
