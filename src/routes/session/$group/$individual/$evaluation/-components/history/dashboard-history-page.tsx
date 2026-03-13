import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import createHref from '@/lib/links';
import { cn } from '@/lib/utils';
import { Edit2Icon, SearchIcon } from 'lucide-react';
import { GenerateSavedFileName } from '@/lib/writer';
import BackButton from '@/components/ui/back-button';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTable } from '@/components/ui/data-table-common';
import { ModifiedSessionResult } from '@/types/storage';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import { useMutation, useQuery } from '@tanstack/react-query';
import { mutationSettingsOutcomes } from '@/queries/outcomes/mutate-session-outcomes';
import { toast } from 'sonner';
import { ErrorDisplay } from '@/components/suspense/error-display';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { queryClient } from '@/App';
import { useContext } from 'react';
import { FolderHandleContext } from '@/context/folder-context';
import { Link } from '@tanstack/react-router';

export default function DashboardHistoryPage({
  Group,
  Individual,
  Evaluation,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
}) {
  const { settings, handle } = useContext(FolderHandleContext);

  const { data, isLoading, error } = useQuery(sessionOutcomesQueryOptions(handle!, Group, Individual, Evaluation));

  const mutateSessionOutcomes = useMutation({
    mutationFn: mutationSettingsOutcomes,
    onSuccess: (data) => {
      queryClient.setQueryData(['/', Group, Individual, Evaluation, 'outcomes'], data);
    },
  });

  if (isLoading) return <LoadingDisplay />;

  if (error || data == undefined) return <ErrorDisplay Text={'An error occurred while fetching session outcomes.'} />;

  const columns: ColumnDef<ModifiedSessionResult>[] = [
    {
      accessorKey: 'SessionSettings.Session',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Session" />,
      cell: ({ row }) => {
        return (
          <div className="flex flex-row gap-1">
            <p>{row.original.SessionSettings.Session}</p>
            <p
              className={cn(
                'transition-colors bg-transparent rounded-full px-2 text-sm flex items-center w-fit whitespace-nowrap',
                {
                  'bg-green-600 text-white': row.original.SessionSettings.Role === 'Primary',
                  'bg-purple-400 text-white': row.original.SessionSettings.Role === 'Reliability',
                },
              )}
            >
              {`${row.original.SessionSettings.Role}`}
            </p>
          </div>
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
      accessorKey: 'Actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex flex-row justify-end gap-2">
          <Link
            className="flex flex-row items-center"
            to="/session/$group/$individual/$evaluation/history/view/$file"
            params={{
              group: Group,
              individual: Individual,
              evaluation: Evaluation,
              file: GenerateSavedFileName(row.original.SessionSettings).replaceAll('.json', ''),
            }}
          >
            <Button variant={'outline'} className="shadow" size={'sm'}>
              <SearchIcon className="mr-2 h-4 w-4" />
              View
            </Button>
          </Link>

          {settings.EnableFileDeletion && (
            <Link
              className="flex flex-row items-center"
              to="/session/$group/$individual/$evaluation/history/edit/$file"
              params={{
                group: Group,
                individual: Individual,
                evaluation: Evaluation,
                file: GenerateSavedFileName(row.original.SessionSettings).replaceAll('.json', ''),
              }}
            >
              <Button variant={'outline'} className="shadow" size={'sm'}>
                <Edit2Icon className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
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
            <CardTitle>Session History ({Evaluation})</CardTitle>
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

          <DataTable
            settings={settings}
            columns={columns}
            data={data}
            callback={async (rows) => {
              // TODO: Confirm deletion with user

              toast.promise(
                async () =>
                  await mutateSessionOutcomes.mutateAsync({
                    Handle: handle!,
                    Group,
                    Individual,
                    Evaluation,
                    Outcomes: rows,
                    Action: 'Delete',
                  }),
                {
                  loading: 'Deleting specific session files...',
                  success: () => {
                    return 'Session files have been deleted successfully!';
                  },
                  error: () => {
                    return 'An error occurred while deleting specific session files.';
                  },
                },
              );
            }}
            customCheckboxButton2={<>Rename Conditions</>}
            callback2={async (rows) => {
              const new_condition = prompt('Enter new condition name for selected sessions:');
              if (!new_condition) {
                return;
              }

              // TODO: Limit to sane characters and length (i.e., no dupes or short entries)

              toast.promise(
                async () =>
                  await mutateSessionOutcomes.mutateAsync({
                    Handle: handle!,
                    Group,
                    Individual,
                    Evaluation,
                    Outcomes: rows,
                    Action: 'EditCondition',
                    ConditionRename: new_condition,
                  }),
                {
                  loading: 'Renaming conditions for selected session files...',
                  success: () => {
                    return 'Session files have been renamed successfully!';
                  },
                  error: () => {
                    return 'An error occurred while renaming conditions for selected session files.';
                  },
                },
              );

              // TODO: Clear out blanks
              /*
              const clearBlanks = async () => {
                const client_evaluations_folder = await GetHandleEvaluationFolder(
                  Handle,
                  CleanUpString(Group),
                  CleanUpString(Individual),
                  CleanUpString(Evaluation)
                );

                for await (const filename of await client_evaluations_folder.values()) {
                  if (filename.kind === 'directory') {
                    const condition_folder = await client_evaluations_folder.getDirectoryHandle(filename.name);

                    let file_count = 0;
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    for await (const _ of await condition_folder.values()) {
                      file_count = file_count = 1;
                    }

                    if (file_count < 1 && filename.name.trim() !== new_condition.trim()) {
                      await client_evaluations_folder.removeEntry(filename.name, { recursive: true });
                    }
                  }
                }
              };
              */
            }}
          />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
