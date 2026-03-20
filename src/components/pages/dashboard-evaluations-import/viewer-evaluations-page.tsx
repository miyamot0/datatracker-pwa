import { queryClient } from '@/App';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTable } from '@/components/ui/data-table-common';
import { mutationEvaluationsAll } from '@/queries/evaluations/mutate-evaluations-all';
import { EvaluationRecord } from '@/queries/keysets/types/evaluation-record';
import { ApplicationSettingsTypes } from '@/types/settings';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { ImportIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function ViewerEvaluationsPage({
  Group,
  Individual,
  Handle,
  Settings,
  Evaluations,
}: {
  Group: string;
  Individual: string;
  Handle: FileSystemDirectoryHandle;
  Settings: ApplicationSettingsTypes;
  Evaluations: EvaluationRecord[];
}) {
  const router = useRouter();
  const routerState = useRouterState();
  const currentRouteId = routerState.matches[routerState.matches.length - 1]?.routeId;

  const mutateEvaluationsMeta = useMutation({
    mutationFn: mutationEvaluationsAll,
    onSuccess: async (data) => {
      queryClient.setQueryData(['/', 'metaEvaluations'], data);

      await queryClient.invalidateQueries({ queryKey: ['/', Group, Individual] });
      await router.invalidate({
        filter: (match) => match.routeId === currentRouteId || match.routeId === '/session/$group/$individual/',
        sync: true,
      });
    },
  });

  const current_evaluations = Evaluations.filter((record) => record.Individual === Individual).map(
    (record) => record.Evaluation,
  );

  const filtered_data = Evaluations.filter(
    (record) => record.Individual !== Individual && !current_evaluations.includes(record.Evaluation),
  );

  const columns: ColumnDef<EvaluationRecord>[] = [
    {
      accessorKey: 'Group',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Group" />,
    },
    {
      accessorKey: 'Individual',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Individual" />,
    },
    {
      accessorKey: 'Evaluation',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Evaluation" />,
    },
    {
      accessorKey: 'Conditions',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Conditions" />,
      cell: ({ row }) => <div className="flex flex-row gap-1">{row.original.Conditions?.join(', ')}</div>,
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row justify-between">
        <div className="flex flex-col gap-1.5 grow">
          <CardTitle>Prior Evaluation Import</CardTitle>
          <CardDescription>Import Existing Evaluations/Conditions</CardDescription>
        </div>
        <BackButton />
      </CardHeader>

      <CardContent className="flex flex-col gap-1.5">
        <p>
          This page lists Evaluations that have been created for those <i>other than</i> the current client. Each
          represents an Evaluation folder with various associated conditions. Note: Importing an Evaluation will pull
          the relevant folder structure, but not the prior data nor prior KeySet files. Those must be imported (if
          necessary) separately.
        </p>

        <DataTable
          settings={Settings}
          columns={columns}
          data={filtered_data}
          forceShowCheckbox
          filterCol="Evaluation"
          customCheckboxButton={
            <>
              <ImportIcon className="h-4 w-4 mr-2" />
              Import Evaluation(s)
            </>
          }
          callback={(rows) => {
            toast.promise(
              async () =>
                await mutateEvaluationsMeta.mutateAsync({
                  Handle,
                  Group,
                  Individual,
                  RelevantRecords: rows,
                  Action: 'Import',
                }),
              {
                loading: 'Importing evaluations...',
                success: () => {
                  return 'Client folders have been imported successfully!';
                },
                error: () => {
                  return 'An error occurred while importing folders.';
                },
              },
            );
          }}
        />
      </CardContent>
    </Card>
  );
}
