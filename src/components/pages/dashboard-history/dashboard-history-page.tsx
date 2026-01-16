import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GetHandleEvaluationFolder, GetResultsFromEvaluationFolder } from '@/lib/files';
import createHref from '@/lib/links';
import { cn } from '@/lib/utils';
import { Edit2Icon, SearchIcon } from 'lucide-react';
import { Link, redirect, useLoaderData } from 'react-router-dom';
import { FolderHandleContextType } from '@/context/folder-context';
import { CleanUpString } from '@/lib/strings';
import { GenerateSavedFileName } from '@/lib/writer';
import BackButton from '@/components/ui/back-button';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTable } from '@/components/ui/data-table-common';
import { ApplicationSettingsTypes } from '@/types/settings';
import { ModifiedSessionResult } from '@/types/storage';
import { useState } from 'react';
import { toast } from 'sonner';

type LoaderResult = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Handle: FileSystemDirectoryHandle;
  Results: ModifiedSessionResult[];
  Settings: ApplicationSettingsTypes;
};

// eslint-disable-next-line react-refresh/only-export-components
export const sessionHistoryLoader = (ctx: FolderHandleContextType) => {
  const { handle, settings } = ctx;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async ({ params }: any) => {
    const { Group, Individual, Evaluation } = params;

    if (!Group || !Individual || !Evaluation || !handle) {
      const response = redirect(createHref({ type: 'Dashboard' }));
      throw response;
    }

    const { results } = await GetResultsFromEvaluationFolder(handle, Group, Individual, Evaluation);

    const clean_results = results
      .map((r) => {
        return {
          ...r,
          Filename: r.Filename!,
        };
      })
      .sort((a, b) => new Date(b.SessionSettings.Session).valueOf() - new Date(a.SessionSettings.Session).valueOf());

    return {
      Group: CleanUpString(Group),
      Individual: CleanUpString(Individual),
      Evaluation: CleanUpString(Evaluation),
      Handle: handle,
      Results: clean_results,
      Settings: settings,
    } satisfies LoaderResult;
  };
};

export default function DashboardHistoryPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Evaluation, Handle, Results, Settings } = loaderResult;

  const [results, setResults] = useState(Results);

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
                }
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
              View
            </Button>
          </Link>
          <Link
            className="flex flex-row items-center"
            to={createHref({
              type: 'Evaluation Session Manager',
              group: Group,
              individual: Individual,
              evaluation: Evaluation,
              index: row.original.Filename,
            })}
          >
            <Button variant={'outline'} className="shadow" size={'sm'}>
              <Edit2Icon className="mr-2 h-4 w-4" />
              Edit
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
            settings={Settings}
            columns={columns}
            data={results}
            callback={async (rows) => {
              const fileNames = rows.map((row) => row.Filename);

              const client_evaluations_folder = await GetHandleEvaluationFolder(
                Handle,
                CleanUpString(Group),
                CleanUpString(Individual),
                CleanUpString(Evaluation)
              );

              const removeSelectedFiles = async (fileNames: string[]) => {
                for await (const entry of await client_evaluations_folder.values()) {
                  if (entry.kind === 'directory') {
                    const condition_folder = await client_evaluations_folder.getDirectoryHandle(entry.name);

                    for await (const fileName of await condition_folder.values()) {
                      if (fileNames.includes(fileName.name)) {
                        await condition_folder.removeEntry(fileName.name);
                      }
                    }
                  }
                }

                setResults((prev) => prev.filter((r) => !fileNames.includes(r.Filename)));
              };

              toast.promise(async () => await removeSelectedFiles(fileNames), {
                loading: 'Deleting specific session files...',
                success: () => {
                  return 'Session files have been deleted successfully!';
                },
                error: () => {
                  return 'An error occurred while deleting specific session files.';
                },
              });
            }}
            customCheckboxButton2={<>Rename Conditions</>}
            callback2={async (rows) => {
              const new_condition = prompt('Enter new condition name for selected sessions:');
              if (!new_condition) {
                return;
              }

              const file_names_to_move = rows.map((row) => row.Filename);

              const moveSelectedFiles = async () => {
                const client_evaluations_folder = await GetHandleEvaluationFolder(
                  Handle,
                  CleanUpString(Group),
                  CleanUpString(Individual),
                  CleanUpString(Evaluation)
                );

                const moved_condition_handle = await client_evaluations_folder.getDirectoryHandle(
                  new_condition.trim(),
                  {
                    create: true,
                  }
                );

                const new_session_files: ModifiedSessionResult[] = [];

                for await (const filename of await client_evaluations_folder.values()) {
                  if (filename.kind === 'directory') {
                    const condition_folder = await client_evaluations_folder.getDirectoryHandle(filename.name);
                    for await (const sub_dir_file of await condition_folder.values()) {
                      if (file_names_to_move.includes(sub_dir_file.name)) {
                        const relevant_result = rows.find((r) => r.Filename === sub_dir_file.name);

                        if (!relevant_result) return;

                        const new_object = { ...relevant_result };
                        new_object.SessionSettings.Condition = new_condition.trim();

                        const new_file_name = GenerateSavedFileName(new_object.SessionSettings);
                        const new_file_handle = await moved_condition_handle.getFileHandle(new_file_name, {
                          create: true,
                        });

                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { Filename, ...ModifiedResult } = relevant_result;

                        const writer = await new_file_handle.createWritable();
                        await writer.write(JSON.stringify(ModifiedResult));
                        await writer.close();

                        const file_to_add = { ...new_object, Filename: new_file_name };
                        new_session_files.push(file_to_add);

                        await condition_folder.removeEntry(sub_dir_file.name);
                      }
                    }
                  }
                }

                const updated_results = results
                  .filter((r) => !file_names_to_move.includes(r.Filename))
                  .concat(new_session_files)
                  .sort(
                    (a, b) =>
                      new Date(b.SessionSettings.Session).valueOf() - new Date(a.SessionSettings.Session).valueOf()
                  );

                setResults(updated_results);
              };

              toast.promise(async () => await moveSelectedFiles(), {
                loading: 'Re-conditioning selected sessions...',
                success: () => {
                  return 'Session files have been updated successfully!';
                },
                error: () => {
                  return 'An error occurred while updating specific session files.';
                },
              });

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
