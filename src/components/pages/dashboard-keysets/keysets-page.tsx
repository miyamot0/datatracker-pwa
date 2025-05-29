import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Edit2, ImportIcon, Plus } from 'lucide-react';
import { Link, redirect, useLoaderData } from 'react-router-dom';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import { useQueryKeyboardsFixed } from '@/hooks/keyboards/useQueryKeyboards';
import createHref from '@/lib/links';
import LoadingDisplay from '@/components/ui/loading-display';
import BackButton from '@/components/ui/back-button';
import { ColumnDef } from '@tanstack/react-table';
import { KeySet } from '@/types/keyset';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTable } from '@/components/ui/data-table-common';
import { FolderHandleContextType } from '@/context/folder-context';
import { CleanUpString } from '@/lib/strings';
import { toast } from 'sonner';

type LoaderResult = {
  Group: string;
  Individual: string;
  Handle: FileSystemHandle;
  Context: FolderHandleContextType;
};

// eslint-disable-next-line react-refresh/only-export-components
export const keysetsPageLoader = (ctx: FolderHandleContextType) => {
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

export default function KeySetsPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Context } = loaderResult;

  const { data, status, error, addKeyboard, removeKeyboards, duplicateKeyboard } = useQueryKeyboardsFixed(
    Group,
    Individual,
    Context
  );

  if (status === 'loading') {
    return <LoadingDisplay />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const columns: ColumnDef<KeySet>[] = [
    {
      accessorKey: 'Name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Keyset Name" />,
      enableHiding: true,
    },
    {
      accessorKey: 'FrequencyKeys',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Frequency Keys" />,
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            {row.original.FrequencyKeys.map((key) => {
              return `${key.KeyDescription} (${key.KeyName.toUpperCase()})`;
            }).join(', ')}
          </div>
        );
      },
    },
    {
      accessorKey: 'DurationKeys',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Duration Keys" />,
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            {row.original.DurationKeys.map((key) => {
              return `${key.KeyDescription} (${key.KeyName.toUpperCase()})`;
            }).join(', ')}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date Created" />,
      cell: ({ row }) => {
        return <span>{row.original.createdAt.toLocaleDateString()}</span>;
      },
    },
    {
      accessorKey: 'Actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        return (
          <div className="flex flex-row justify-end gap-2">
            <Button
              size={'sm'}
              variant={'outline'}
              onClick={async () => {
                await duplicateKeyboard(row.original);
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Link unstable_viewTransition to={`/session/${Group}/${Individual}/keysets/${row.original.Name}`}>
              <Button size={'sm'} variant={'outline'}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
      ]}
      label={'Keysets'}
      className="select-none"
    >
      <Card className="w-full max-w-screen-2xl">
        <CardHeader className="flex flex-col md:flex-row w-full justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Keyset Directory: {Individual}</CardTitle>
            <CardDescription>Create or Edit Current Keysets</CardDescription>
          </div>
          <div className="flex flex-row gap-2">
            <BackButton
              Label="Back to Evaluations"
              Href={createHref({ type: 'Evaluations', group: Group, individual: Individual })}
            />
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-1.5">
          <p>
            This page lists various keysets that have been created for the client. Each keyset is a collection of keys
            that specify a key-behavior relationship. You must have at least <i>one</i> keyset to begin recording client
            data.
          </p>

          <DataTable
            settings={Context.settings}
            columns={columns}
            data={data}
            callback={(rows) => {
              toast.promise(async () => await removeKeyboards(rows), {
                loading: 'Deleting KeySet files...',
                success: () => {
                  return 'KeySet files have been deleted successfully!';
                },
                error: () => {
                  return 'An error occurred while deleting KeySet files.';
                },
              });
            }}
            filterCol="Name"
            optionalButtons={
              <div className="flex flex-row gap-2">
                <ToolTipWrapper Label="Create a new KeySet for individual">
                  <Button
                    variant={'outline'}
                    className="shadow"
                    size={'sm'}
                    onClick={async () => {
                      await addKeyboard();
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create
                  </Button>
                </ToolTipWrapper>
                <ToolTipWrapper Label="Import an existing KeySet for this client">
                  <Button variant={'outline'} className="shadow" size={'sm'}>
                    <Link
                      to={`/session/${Group}/${Individual}/keysets/import`}
                      unstable_viewTransition
                      className="flex flex-row items-center"
                    >
                      <ImportIcon className="mr-2 h-4 w-4" />
                      Import
                    </Link>
                  </Button>
                </ToolTipWrapper>
              </div>
            }
          />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
