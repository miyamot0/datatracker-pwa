import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { SavedSessionResult } from '@/lib/dtos';
import { GetResultsFromEvaluationFolder } from '@/lib/files';
import { CleanUpString } from '@/lib/strings';
import { KeySet, KeySetInstance } from '@/types/keyset';
import { useState } from 'react';
import { FilterByPrimaryRole } from './helpers/filtering';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SessionTerminationOptionsType } from '@/forms/schema/session-designer-schema';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { KeyboardIcon, PointerIcon, ScatterChartIcon } from 'lucide-react';
import RateFigureVisualization from './figures/rate-figure';
import { getLocalCachedPrefs, setLocalCachedPrefs } from '@/lib/local_storage';
import createHref from '@/lib/links';
import { Link, redirect, useLoaderData } from 'react-router-dom';
import { FolderHandleContextType } from '@/context/folder-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BackButton from '@/components/ui/back-button';
import { toast } from 'sonner';

type LoaderResult = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Handle: FileSystemHandle;
  Results: SavedSessionResult[];
  DynamicKeySet: KeySet;
  Schedule: SessionTerminationOptionsType;
  ShowKeys: {
    KeyDescription: string;
    Visible: boolean;
  }[];
  ExcludeKeysFromCTB: {
    KeyDescription: string;
    Visible: boolean;
  }[];
};

// eslint-disable-next-line react-refresh/only-export-components
export const resultsViewerRate = (ctx: FolderHandleContextType) => {
  const { handle } = ctx;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async ({ params }: any) => {
    const { Group, Individual, Evaluation } = params;

    if (!Group || !Individual || !Evaluation || !handle) {
      const response = redirect(createHref({ type: 'Dashboard' }));
      throw response;
    }

    const { keyset, results } = await GetResultsFromEvaluationFolder(handle, Group, Individual, Evaluation);

    if (!keyset) {
      toast.error('Error: Could not recover KeySet in this folder.', {
        duration: 4000,
      });

      const response = redirect(createHref({ type: 'Evaluations', individual: Individual, group: Group }));
      throw response;
    }

    const all_keysets = results.map((result) => result.Keyset);
    const all_fkeys = all_keysets.map((keyset) => keyset.FrequencyKeys).flat();
    const all_dkeys = all_keysets.map((keyset) => keyset.DurationKeys).flat();

    const targeted_fkeys: KeySetInstance[] = [];
    all_fkeys.forEach((key) => {
      if (!targeted_fkeys.some((k) => k.KeyCode === key.KeyCode)) {
        targeted_fkeys.push(key);
      }
    });

    const targeted_dkeys: KeySetInstance[] = [];
    all_dkeys.forEach((key) => {
      if (!targeted_dkeys.some((k) => k.KeyCode === key.KeyCode)) {
        targeted_dkeys.push(key);
      }
    });

    const dynamic_keyset = {
      ...keyset,
      FrequencyKeys: targeted_fkeys,
      DurationKeys: targeted_dkeys,
    } as unknown as KeySet;

    const keys = dynamic_keyset.FrequencyKeys.map((key) => ({
      KeyDescription: key.KeyDescription,
      Visible: true,
    }));

    const stored_prefs = getLocalCachedPrefs(Group, Individual, Evaluation, 'Rate');

    const ctb_entry = {
      KeyDescription: 'CTB',
      Visible: true,
    };

    const show_keys_base = [...keys, ctb_entry].map((key) => {
      const should_disable = stored_prefs.KeyDescription.includes(key.KeyDescription);

      if (should_disable) {
        return {
          ...key,
          Visible: false,
        };
      }

      return key;
    });

    const exclude_from_ctb = keys.map((key) => {
      const should_disable = stored_prefs.CTBElements.includes(key.KeyDescription);

      if (should_disable) {
        return {
          ...key,
          Visible: false,
        };
      }

      return key;
    });

    return {
      Group: CleanUpString(Group),
      Individual: CleanUpString(Individual),
      Evaluation: CleanUpString(Evaluation),
      Handle: handle,
      Results: results,
      DynamicKeySet: dynamic_keyset,
      ShowKeys: show_keys_base,
      ExcludeKeysFromCTB: exclude_from_ctb,
      Schedule: stored_prefs.Schedule ?? 'End on Timer #1',
    } satisfies LoaderResult;
  };
};

export default function ResultsRateVisualsPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Evaluation, ShowKeys, DynamicKeySet, Results, Schedule, ExcludeKeysFromCTB } =
    loaderResult;
  const [filteredKeys, setFilteredKeys] = useState(ShowKeys);
  const [schedule, setSchedule] = useState<SessionTerminationOptionsType>(Schedule);
  const [ctbSumKeys, setCTBSumKeys] = useState(ExcludeKeysFromCTB);

  const results_filtered = FilterByPrimaryRole(Results);

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(CleanUpString(Group)),
        BuildEvaluationsBreadcrumb(CleanUpString(Group), CleanUpString(Individual)),
      ]}
      label={`${CleanUpString(CleanUpString(Evaluation))}: Target Rates`}
      className="select-none"
    >
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex flex-col gap-1.5 grow">
            <CardTitle>Visualization of Behavioral Rates</CardTitle>
            <CardDescription>Options for Visualizing Data Provided Below</CardDescription>
          </div>
          <div className="flex gap-2">
            <Link
              unstable_viewTransition
              to={createHref({
                type: 'Evaluation Visualizer-Proportion',
                group: Group,
                individual: Individual,
                evaluation: Evaluation,
              })}
            >
              <Button variant={'outline'} className="shadow" size={'sm'}>
                <ScatterChartIcon className="mr-2 h-4 w-4" />
                See Proportion
              </Button>
            </Link>
            <BackButton
              Label="Back to Evaluations"
              Href={createHref({ type: 'Evaluations', group: Group, individual: Individual })}
            />
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
          <div className="w-full flex flex-row justify-between mb-4">
            <div className="flex flex-row gap-4">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-fit">
                    <KeyboardIcon className="mr-2 w-4 h-4" />
                    Edit Keys Displayed
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Toggle Visibility</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {filteredKeys.map((key, index) => (
                    <DropdownMenuCheckboxItem
                      key={`key-${index}`}
                      checked={key.Visible}
                      onCheckedChange={(checked) => {
                        const updatedKeys = filteredKeys.map((k) => {
                          if (k.KeyDescription === key.KeyDescription) {
                            return {
                              ...k,
                              Visible: checked,
                            };
                          }

                          return k;
                        });

                        setFilteredKeys(updatedKeys);

                        const hidden_keys = updatedKeys.filter((k) => k.Visible === false).map((k) => k.KeyDescription);

                        const exclude_from_ctb = ctbSumKeys
                          .filter((k) => k.Visible === false)
                          .map((k) => k.KeyDescription);

                        setLocalCachedPrefs(Group, Individual, Evaluation, 'Rate', {
                          KeyDescription: hidden_keys,
                          CTBElements: exclude_from_ctb,
                          Schedule: schedule,
                        });
                      }}
                    >
                      {key.KeyDescription}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-fit">
                    <PointerIcon className="mr-2 w-4 h-4" />
                    Select Keys for CTB Calculation
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Toggle Inclusion</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ctbSumKeys.map((key, index) => (
                    <DropdownMenuCheckboxItem
                      key={`key-${index}`}
                      checked={key.Visible}
                      onCheckedChange={(checked: boolean) => {
                        const updatedKeys = ctbSumKeys.map((k) => {
                          if (k.KeyDescription === key.KeyDescription) {
                            return {
                              ...k,
                              Visible: checked,
                            };
                          }

                          return k;
                        });

                        const hidden_keys = filteredKeys
                          .filter((k) => k.Visible === false)
                          .map((k) => k.KeyDescription);

                        const exclude_from_ctb = updatedKeys
                          .filter((k) => k.Visible === false)
                          .map((k) => k.KeyDescription);

                        setLocalCachedPrefs(Group, Individual, Evaluation, 'Rate', {
                          KeyDescription: hidden_keys,
                          CTBElements: exclude_from_ctb,
                          Schedule: schedule,
                        });

                        setCTBSumKeys(updatedKeys);
                      }}
                    >
                      {key.KeyDescription}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-row items-center gap-2 w-fit">
              <p>Select Timer to Reference:</p>
              <Select
                value={schedule}
                onValueChange={(value: SessionTerminationOptionsType) => {
                  setSchedule(value);

                  const hidden_keys = filteredKeys.filter((k) => k.Visible === false).map((k) => k.KeyDescription);

                  const exclude_from_ctb = ctbSumKeys.filter((k) => k.Visible === false).map((k) => k.KeyDescription);

                  setLocalCachedPrefs(Group, Individual, Evaluation, 'Rate', {
                    KeyDescription: hidden_keys,
                    CTBElements: exclude_from_ctb,
                    Schedule: value,
                  });
                }}
              >
                <SelectTrigger className="w-fit">
                  <SelectValue placeholder="Data Collector Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={'End on Timer #1' as SessionTerminationOptionsType}>
                      Score on Timer #1 Time
                    </SelectItem>
                    <SelectItem value={'End on Timer #2' as SessionTerminationOptionsType}>
                      Score on Timer #2 Time
                    </SelectItem>
                    <SelectItem value={'End on Timer #3' as SessionTerminationOptionsType}>
                      Score on Timer #3 Time
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p>
            This page provides a visual of the available data regarding <i>rate</i>. For convenience, series of data can
            be enabled or disabled for viewing. Similarly, an omnibus measure of behavior can be calculated by selecting
            which types of events to combine together (i.e., a combined target behavior [CTB] metric). Options set here
            will persist for future visits.
          </p>

          {DynamicKeySet && (
            <RateFigureVisualization
              FilteredSessions={results_filtered}
              ScheduleOption={schedule}
              CTBKeys={ctbSumKeys}
              KeySetFull={filteredKeys}
            />
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
