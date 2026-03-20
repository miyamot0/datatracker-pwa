import PageWrapper from '@/components/elements/page-wrapper';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, ArrowUp, ChevronDown, DeleteIcon } from 'lucide-react';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildKeysetBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { CleanUpString } from '@/lib/strings';
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
import FrequencyDialogKeyCreator from './dialogs/frequency-dialog';
import DurationDialogKeyCreator from './dialogs/duration-dialog';
import LogicalDialogKeyCreator from './dialogs/logical-dialog';
import { generateFormula, LogicState } from '@/lib/logic';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

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

  const relevantKeySet = data.find((ks) => ks.Name === KeySet);

  if (!relevantKeySet) return <ErrorDisplay Text={'KeySet not found.'} />;

  const addKeyCallback = async (base_keyset: KeySet, new_key: KeySetInstance, type: 'Duration' | 'Frequency') => {
    let new_state = {
      ...base_keyset,
      lastModified: new Date(),
    } satisfies KeySet;

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

  const addDerivedKeyCallback = async (logic: LogicState) => {
    const new_state = {
      ...relevantKeySet,
      // Note: hack to kick off re-render
      FrequencyKeys: [...relevantKeySet.FrequencyKeys],
      DurationKeys: [...relevantKeySet.DurationKeys],
      DerivedKeys: [...(relevantKeySet.DerivedKeys || []), logic],
      lastModified: new Date(),
    } satisfies KeySet;

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

  const btnProps = buttonVariants({ variant: 'outline', size: 'sm' });

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
              <div className={cn(btnProps, 'pl-3 pr-0')}>
                <FrequencyDialogKeyCreator KeySet={relevantKeySet} Callback={addKeyCallback} />

                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <ChevronDown className="w-fit px-2" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48" side="bottom" align="end" sideOffset={12}>
                    <DropdownMenuLabel>Custom Key Types</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <LogicalDialogKeyCreator
                      KeySet={relevantKeySet}
                      Callback={addDerivedKeyCallback}
                      key={
                        relevantKeySet.DurationKeys.length +
                        relevantKeySet.FrequencyKeys.length +
                        relevantKeySet.DerivedKeys.length
                      }
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <BackButton />
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
                        onClick={async () => {
                          const newFrequencyKeys = moveItemUp(relevantKeySet.FrequencyKeys, index);
                          const new_state = {
                            ...relevantKeySet,
                            FrequencyKeys: newFrequencyKeys,
                          };
                          await mutateKeySet(new_state);
                        }}
                      >
                        <ArrowUp size={14} className="mr" />
                      </Button>

                      <Button
                        size={'sm'}
                        variant={'outline'}
                        disabled={index === relevantKeySet.FrequencyKeys.length - 1}
                        onClick={async () => {
                          const newFrequencyKeys = moveItemDown(relevantKeySet.FrequencyKeys, index);
                          const new_state = {
                            ...relevantKeySet,
                            FrequencyKeys: newFrequencyKeys,
                          };
                          await mutateKeySet(new_state);
                        }}
                      >
                        <ArrowDown size={14} className="mr" />
                      </Button>

                      <Button
                        size={'sm'}
                        variant={'destructive'}
                        className="shadow-xl"
                        onClick={async () => {
                          const confirmation = window.confirm('Are you sure you want to remove this key?');

                          if (!confirmation) return;

                          const new_state = {
                            ...relevantKeySet,
                            FrequencyKeys: relevantKeySet.FrequencyKeys.filter((_key) => _key.KeyCode !== key.KeyCode),
                          };

                          await mutateKeySet(new_state);
                        }}
                      >
                        <DeleteIcon size={14} className="mr-2" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {relevantKeySet.DerivedKeys?.map((state, index) => (
                  <TableRow key={index} className="bg-muted">
                    <TableCell>{state.name} (Derived)</TableCell>
                    <TableCell>{generateFormula(state)}</TableCell>
                    <TableCell className="flex flex-row gap-2 justify-end">
                      <Button
                        size={'sm'}
                        variant={'destructive'}
                        className="shadow-xl"
                        onClick={async () => {
                          const confirmation = window.confirm('Are you sure you want to remove this key?');

                          if (!confirmation) return;

                          const new_state = {
                            ...relevantKeySet,
                            DerivedKeys: relevantKeySet.DerivedKeys?.filter((_key) => _key.id !== state.id),
                          } satisfies KeySet;

                          await mutateKeySet(new_state);
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

              <BackButton />
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
                        onClick={async () => {
                          const newDurationKeys = moveItemUp(relevantKeySet.DurationKeys, index);
                          const new_state = {
                            ...relevantKeySet,
                            DurationKeys: newDurationKeys,
                          };
                          await mutateKeySet(new_state);
                        }}
                      >
                        <ArrowUp size={14} className="mr" />
                      </Button>

                      <Button
                        size={'sm'}
                        variant={'outline'}
                        disabled={index === relevantKeySet.DurationKeys.length - 1}
                        onClick={async () => {
                          const newDurationKeys = moveItemDown(relevantKeySet.DurationKeys, index);
                          const new_state = {
                            ...relevantKeySet,
                            DurationKeys: newDurationKeys,
                          };
                          await mutateKeySet(new_state);
                        }}
                      >
                        <ArrowDown size={14} className="mr" />
                      </Button>

                      <Button
                        size={'sm'}
                        variant={'destructive'}
                        onClick={async () => {
                          const confirmation = window.confirm('Are you sure you want to remove this key?');

                          if (!confirmation) return;

                          const new_state = {
                            ...relevantKeySet,
                            DurationKeys: relevantKeySet.DurationKeys.filter((_key) => _key.KeyCode !== key.KeyCode),
                          };

                          await mutateKeySet(new_state);
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
