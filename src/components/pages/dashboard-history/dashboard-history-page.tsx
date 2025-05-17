import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SavedSessionResult } from '@/lib/dtos';
import { GetResultsFromEvaluationFolder } from '@/lib/files';
import createHref from '@/lib/links';
import { cn } from '@/lib/utils';
import { ChevronRight, SearchIcon } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useContext } from 'react';
import { useEffect, useState } from 'react';
import { FolderHandleContext } from '@/context/folder-context';
import LoadingDisplay from '@/components/ui/loading-display';
import { CleanUpString } from '@/lib/strings';
import { GenerateSavedFileName } from '@/lib/writer';
import BackButton from '@/components/ui/back-button';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTable } from '@/components/ui/data-table-common';

export function DashboardHistoryPageShim() {
  const { handle } = useContext(FolderHandleContext);
  const navigate = useNavigate();

  const { Group, Individual, Evaluation } = useParams();

  useEffect(() => {
    if (!handle) {
      navigate(createHref({ type: 'Dashboard' }), {
        unstable_viewTransition: true,
      });
      return;
    }
  }, [handle, navigate]);

  if (!handle) return <LoadingDisplay />;

  if (!Group || !Individual || !Evaluation) {
    navigate(createHref({ type: 'Dashboard' }), {
      unstable_viewTransition: true,
    });
    return;
  }

  return (
    <DashboardHistoryPage
      Handle={handle}
      Group={CleanUpString(Group)}
      Individual={CleanUpString(Individual)}
      Evaluation={CleanUpString(Evaluation)}
    />
  );
}

type Props = {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
  Evaluation: string;
};

function DashboardHistoryPage({ Handle, Group, Individual, Evaluation }: Props) {
  const [sessions, setSessionsData] = useState<SavedSessionResult[]>([]);

  useEffect(() => {
    if (!Handle) return;

    const file_puller = async () => {
      const { results } = await GetResultsFromEvaluationFolder(Handle, Group, Individual, Evaluation);

      setSessionsData(
        results.sort(
          (a, b) => new Date(a.SessionSettings.Session).valueOf() - new Date(b.SessionSettings.Session).valueOf()
        )
      );
    };

    file_puller();

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    () => {};
  }, [Handle, Group, Individual, Evaluation]);

  const columns: ColumnDef<SavedSessionResult>[] = [
    {
      accessorKey: 'SessionSettings.Session',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Session" />,
    },
    {
      accessorKey: 'SessionSettings.Role',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ row }) => {
        return (
          <p
            className={cn(
              'transition-colors bg-transparent rounded-full px-2 text-sm flex items-center w-fit whitespace-nowrap',
              {
                'bg-green-600 text-white': row.original.SessionSettings.Role === 'Primary',
                'bg-purple-400 text-white': row.original.SessionSettings.Role === 'Reliability',
              }
            )}
          >
            {`${row.original.SessionSettings.Role}`}
          </p>
        );
      },
    },
    {
      accessorKey: 'SessionSettings.Initials',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data Collector" />,
    },
    {
      accessorKey: 'SessionSettings.Condition',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Condition" />,
    },
    {
      accessorKey: 'SessionSettings.TimerMain',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total Duration" />,
      cell: ({ row }) => {
        return <p>{row.original.TimerMain.toFixed(2)}</p>;
      },
    },
    {
      accessorKey: 'SessionEnd',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date Recorded" />,
      cell: ({ row }) => {
        return <p>{`${new Date(row.original.SessionEnd).toLocaleDateString()}`}</p>;
      },
    },
    {
      accessorKey: 'EndedEarly',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Termination" />,
      cell: ({ row }) => {
        return <p>{row.original.EndedEarly === true ? 'Manual' : 'Planned'}</p>;
      },
    },
    {
      accessorKey: 'Actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex flex-row justify-end">
          <Link
            className="flex flex-row items-center"
            to={createHref({
              type: 'Evaluation Session Analysis',
              group: Group,
              individual: Individual,
              evaluation: Evaluation,
              index: GenerateSavedFileName(row.original.SessionSettings).replaceAll('.json', ''),
            })}
          >
            <Button variant={'outline'} className="shadow" size={'sm'}>
              <SearchIcon className="mr-2 h-4 w-4" />
              Viewer
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
      ]}
      label={'Session History'}
      className="select-none"
    >
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex flex-col gap-1.5 grow">
            <CardTitle>Session History</CardTitle>
            <CardDescription>Select Individual Sessions to View More</CardDescription>
          </div>
          <BackButton
            Label="Back to Evaluations"
            Href={createHref({ type: 'Evaluations', group: Group, individual: Individual })}
          />
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
          <p>
            This page provides a summary of the data currently saved on your machine. You may view behavior recorded
            from each session in greater detail by using the 'Inspect Session' button.
          </p>

          <DataTable columns={columns} data={sessions} />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
