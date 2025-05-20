import PageWrapper from '@/components/layout/page-wrapper';
import BackButton from '@/components/ui/back-button';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTable } from '@/components/ui/data-table-common';
import LoadingDisplay from '@/components/ui/loading-display';
import { FolderHandleContextType } from '@/context/folder-context';
import { EvaluationRecord } from '@/hooks/evaluations/types/query-response-type-evaluations';
import { useQueryEvaluationsMetaFixed } from '@/hooks/evaluations/useQueryEvaluationsMeta';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { ColumnDef } from '@tanstack/react-table';
import { ImportIcon } from 'lucide-react';
import { redirect, useLoaderData } from 'react-router-dom';

type LoaderResult = {
  Group: string;
  Individual: string;
  Handle: FileSystemHandle;
  Context: FolderHandleContextType;
};

export const evaluationImportPageLoader = (ctx: FolderHandleContextType) => {
  const { handle } = ctx;

  // @ts-ignore
  return async ({ params, request }) => {
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

export default function ViewerEvaluationsPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Context } = loaderResult;

  const { data, status, error, addEvaluationFolder } = useQueryEvaluationsMetaFixed(Group, Individual, Context);

  if (status === 'loading') {
    return <LoadingDisplay />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const current_evaluations = data
    .filter((record) => record.Individual === Individual)
    .map((record) => record.Evaluation);

  const filtered_data = data.filter(
    (record) => record.Individual !== Individual && !current_evaluations.includes(record.Evaluation)
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Evaluation" />,
      cell: ({ row }) => <div className="flex flex-row gap-1">{row.original.Conditions.join(', ')}</div>,
    },
    {
      accessorKey: 'Actions',

      header: () => <div className="text-right">Import Actions</div>,
      cell: ({ row }) => (
        <div className="flex flex-row justify-end">
          <Button
            variant={'outline'}
            onClick={async () => {
              await addEvaluationFolder(row.original);
            }}
          >
            <ImportIcon className="h-4 w-4 mr-2" />
            Import Evaluation
          </Button>
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
      label={'Evaluation Import'}
      className="select-none"
    >
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex flex-col gap-1.5 grow">
            <CardTitle>Prior Evaluation Import</CardTitle>
            <CardDescription>Import Existing Evaluations/Conditions</CardDescription>
          </div>
          <BackButton
            Label="Back to Evaluations"
            Href={createHref({ type: 'Evaluations', group: Group, individual: Individual })}
          />
        </CardHeader>

        <CardContent className="flex flex-col gap-1.5">
          <p>
            This page lists Evaluations that have been created for those <i>other than</i> the current client. Each
            represents an Evaluation folder with various associated conditions.
          </p>

          <DataTable columns={columns} data={filtered_data} filterCol="Evaluation" />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
