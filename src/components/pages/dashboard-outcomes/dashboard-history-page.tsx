import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Edit2Icon, SearchIcon } from 'lucide-react';
import { GenerateSavedFileName } from '@/lib/writer';
import BackButton from '@/components/ui/back-button';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTable } from '@/components/ui/data-table-common';
import { ModifiedSessionResult } from '@/types/storage';
import { useMutation } from '@tanstack/react-query';
import { mutationSettingsOutcomes } from '@/queries/outcomes/mutate-session-outcomes';
import { toast } from 'sonner';
import { queryClient } from '@/App';
import { Link, useRouter, useRouterState } from '@tanstack/react-router';
import { ApplicationSettingsTypes } from '@/types/settings';

export default function DashboardHistoryPage({
  Group,
  Individual,
  Evaluation,
  Sessions,
  Settings,
  Handle,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  Sessions: ModifiedSessionResult[];
  Settings: ApplicationSettingsTypes;
  Handle: FileSystemDirectoryHandle;
}) {
  const router = useRouter();
  const routerState = useRouterState();
  const currentRouteId = routerState.matches[routerState.matches.length - 1]?.routeId;

  const mutateSessionOutcomes = useMutation({
    mutationFn: mutationSettingsOutcomes,
    onSuccess: async (data) => {
      queryClient.setQueryData(['/', Group, Individual, Evaluation, 'outcomes'], data);

      await router.invalidate({
        filter: (match) =>
          match.routeId === currentRouteId || match.routeId === '/session/$group/$individual/$evaluation/',
        sync: true,
        forcePending: true,
      });
    },
  });

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

          {Settings.EnableFileDeletion && (
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
    <Card className="w-full">
      <CardHeader className="flex flex-row justify-between">
        <div className="flex flex-col gap-1.5 grow">
          <CardTitle>Session History ({Evaluation})</CardTitle>
          <CardDescription>Select Individual Sessions to View More</CardDescription>
        </div>
        <BackButton />
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <p>
          This page provides a summary of the data currently saved on your machine. You may view behavior recorded from
          each session in greater detail by using the 'Inspect Session' button.
        </p>

        <DataTable
          settings={Settings}
          columns={columns}
          data={Sessions}
          callback={async (rows) => {
            const confirm_delete = window.confirm(
              `Are you sure you want to delete ${rows.length} sessions? This CANNOT be undone.`,
            );

            if (!confirm_delete) {
              return;
            }

            toast.promise(
              async () =>
                await mutateSessionOutcomes.mutateAsync({
                  Handle,
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

            if (new_condition.trim().length < 3) {
              return;
            }

            toast.promise(
              async () =>
                await mutateSessionOutcomes.mutateAsync({
                  Handle,
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
          }}
        />
      </CardContent>
    </Card>
  );
}
