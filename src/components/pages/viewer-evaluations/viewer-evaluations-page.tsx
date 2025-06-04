import PageWrapper from '@/components/layout/page-wrapper';
import BackButton from '@/components/ui/back-button';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
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
import { toast } from 'sonner';

type LoaderResult = {
  Group: string;
  Individual: string;
  Handle: FileSystemHandle;
  Context: FolderHandleContextType;
};

// eslint-disable-next-line react-refresh/only-export-components
export const evaluationImportPageLoader = (ctx: FolderHandleContextType) => {
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

export default function ViewerEvaluationsPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Context } = loaderResult;

  const { data, status, error, addEvaluationFolders } = useQueryEvaluationsMetaFixed(Group, Individual, Context);

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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Conditions" />,
      cell: ({ row }) => <div className="flex flex-row gap-1">{row.original.Conditions.join(', ')}</div>,
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
            represents an Evaluation folder with various associated conditions. Note: Importing an Evaluation will pull
            the relevant folder structure, but not the prior data nor prior KeySet files. Those must be imported (if
            necessary) separately.
          </p>

          <DataTable
            settings={Context.settings}
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
              toast.promise(async () => await addEvaluationFolders(rows), {
                loading: 'Deleting client folders...',
                success: () => {
                  return 'Client folders have been deleted successfully!';
                },
                error: () => {
                  return 'An error occurred while deleting client folders.';
                },
              });
            }}
          />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
