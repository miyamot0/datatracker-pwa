import PageWrapper from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import DurationDialogKeyCreator from './dialogs/duration-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FrequencyDialogKeyCreator from './dialogs/frequency-dialog';
import { ArrowDown, ArrowUp, DeleteIcon } from 'lucide-react';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildKeysetBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { CleanUpString } from '@/lib/strings';
import createHref from '@/lib/links';
import BackButton from '@/components/ui/back-button';
import { FolderHandleContext } from '@/context/folder-context';
import { keyboardQueryOptions } from '@/queries/keysets/query-keyboards';
import { KeySetInstance, KeySet } from '@/types/keyset';
import { useMutation, useQuery } from '@tanstack/react-query';
import { mutationKeyboards } from '@/queries/keysets/mutate-keyboards';
import { ErrorDisplay } from '@/components/suspense/error-display';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { useContext } from 'react';
import { queryClient } from '@/App';

export default function KeySetEditor({
  Group,
  Individual,
  KeySet,
}: {
  Group: string;
  Individual: string;
  KeySet: string;
}) {
  const Context = useContext(FolderHandleContext);
  const { handle } = Context;

  const { data, isLoading, error } = useQuery(keyboardQueryOptions(handle!, Group, Individual));

  const mutateKeyboards = useMutation({
    mutationFn: mutationKeyboards,
    onSuccess: (data) => {
      queryClient.setQueryData(['/', Group, Individual, 'keyboards'], data);
    },
  });

  const moveItemUp = <T,>(array: T[], index: number): T[] => {
    if (index === 0) return array; // Already at the top
    const newArray = [...array];
    [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
    return newArray;
  };

  const moveItemDown = <T,>(array: T[], index: number): T[] => {
    if (index === array.length - 1) return array; // Already at the bottom
    const newArray = [...array];
    [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
    return newArray;
  };

  if (isLoading) return <LoadingDisplay />;

  if (error || data == undefined) return <ErrorDisplay Text={'An error occurred while fetching session outcomes.'} />;

  if (!Group || !Individual || !KeySet || !data) {
    throw new Error('Params missing.');
  }

  const relevantKeySet = data.find((ks) => ks.Name === KeySet);

  if (!relevantKeySet) {
    return <div>KeySet not found.</div>;
  }

  const addKeyCallback = async (base_keyset: KeySet, new_key: KeySetInstance, type: 'Duration' | 'Frequency') => {
    let new_state = {
      ...base_keyset,
      lastModified: new Date(),
    };

    if (type === 'Duration') {
      new_state = {
        ...new_state,
        DurationKeys: [...base_keyset.DurationKeys, new_key],
      };
    } else {
      new_state = {
        ...new_state,
        FrequencyKeys: [...base_keyset.FrequencyKeys, new_key],
      };
    }

    await mutateKeySet(new_state);
  };

  const mutateKeySet = async (new_keyset: KeySet) => {
    await mutateKeyboards.mutateAsync({
      Group,
      Individual,
      Keysets: [],
      NewKeySet: new_keyset,
      Handle: handle!,
      Action: 'Update',
    });
  };

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
        BuildKeysetBreadcrumb(Group, Individual),
      ]}
      label={CleanUpString(KeySet)}
      className="select-none"
    >
      <div className="w-full max-w-screen-2xl grid grid-cols-2 gap-2">
        <Card className="w-full flex flex-col justify-between">
          <CardHeader className="flex flex-col md:flex-row justify-between">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Frequency Keys</CardTitle>
              <CardDescription>Manage Frequency Keys</CardDescription>
            </div>

            <div className="flex flex-row gap-2">
              <FrequencyDialogKeyCreator KeySet={relevantKeySet} Callback={addKeyCallback} />

              <BackButton Label="Back" Href={createHref({ type: 'Keysets', group: Group, individual: Individual })} />
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead className="w-[50px] text-right">Editor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relevantKeySet.FrequencyKeys.map((key, index) => (
                  <TableRow key={index}>
                    <TableCell>{key.KeyDescription}</TableCell>
                    <TableCell>{key.KeyName}</TableCell>
                    <TableCell className="flex flex-row gap-2">
                      <Button
                        size={'sm'}
                        variant={'outline'}
                        disabled={index === 0}
                        onClick={() => {
                          const newFrequencyKeys = moveItemUp(relevantKeySet.FrequencyKeys, index);
                          const new_state = {
                            ...relevantKeySet,
                            FrequencyKeys: newFrequencyKeys,
                          };
                          mutateKeySet(new_state);
                        }}
                      >
                        <ArrowUp size={14} className="mr" />
                      </Button>

                      <Button
                        size={'sm'}
                        variant={'outline'}
                        disabled={index === relevantKeySet.FrequencyKeys.length - 1}
                        onClick={() => {
                          const newFrequencyKeys = moveItemDown(relevantKeySet.FrequencyKeys, index);
                          const new_state = {
                            ...relevantKeySet,
                            FrequencyKeys: newFrequencyKeys,
                          };
                          mutateKeySet(new_state);
                        }}
                      >
                        <ArrowDown size={14} className="mr" />
                      </Button>

                      <Button
                        size={'sm'}
                        variant={'destructive'}
                        className="shadow-xl"
                        onClick={() => {
                          const confirmation = window.confirm('Are you sure you want to remove this key?');

                          if (!confirmation) return;

                          const new_state = {
                            ...relevantKeySet,
                            FrequencyKeys: relevantKeySet.FrequencyKeys.filter((_key) => _key.KeyCode !== key.KeyCode),
                          };

                          mutateKeySet(new_state);
                        }}
                      >
                        <DeleteIcon size={14} className="mr-2" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="w-full flex flex-col justify-between">
          <CardHeader className="flex flex-col md:flex-row justify-between">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Duration Keys</CardTitle>
              <CardDescription>Manage Duration Keys</CardDescription>
            </div>

            <div className="flex flex-row gap-2">
              <DurationDialogKeyCreator KeySet={relevantKeySet} Callback={addKeyCallback} />

              <BackButton Label="Back" Href={createHref({ type: 'Keysets', group: Group, individual: Individual })} />
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead className="w-[50px] text-right">Editor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relevantKeySet.DurationKeys.map((key, index) => (
                  <TableRow key={index}>
                    <TableCell>{key.KeyDescription}</TableCell>
                    <TableCell>{key.KeyName}</TableCell>
                    <TableCell className="flex flex-row gap-2">
                      <Button
                        size={'sm'}
                        variant={'outline'}
                        disabled={index === 0}
                        onClick={() => {
                          const newDurationKeys = moveItemUp(relevantKeySet.DurationKeys, index);
                          const new_state = {
                            ...relevantKeySet,
                            DurationKeys: newDurationKeys,
                          };
                          mutateKeySet(new_state);
                        }}
                      >
                        <ArrowUp size={14} className="mr" />
                      </Button>

                      <Button
                        size={'sm'}
                        variant={'outline'}
                        disabled={index === relevantKeySet.DurationKeys.length - 1}
                        onClick={() => {
                          const newDurationKeys = moveItemDown(relevantKeySet.DurationKeys, index);
                          const new_state = {
                            ...relevantKeySet,
                            DurationKeys: newDurationKeys,
                          };
                          mutateKeySet(new_state);
                        }}
                      >
                        <ArrowDown size={14} className="mr" />
                      </Button>

                      <Button
                        size={'sm'}
                        variant={'destructive'}
                        onClick={() => {
                          const confirmation = window.confirm('Are you sure you want to remove this key?');

                          if (!confirmation) return;

                          const new_state = {
                            ...relevantKeySet,
                            DurationKeys: relevantKeySet.DurationKeys.filter((_key) => _key.KeyCode !== key.KeyCode),
                          };

                          mutateKeySet(new_state);
                        }}
                      >
                        <DeleteIcon size={14} className="mr-2" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
