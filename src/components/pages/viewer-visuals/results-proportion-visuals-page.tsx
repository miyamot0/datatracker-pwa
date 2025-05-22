import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { SessionTerminationOptionsType } from '@/forms/schema/session-designer-schema';
import { SavedSessionResult } from '@/lib/dtos';
import { GetResultsFromEvaluationFolder } from '@/lib/files';
import { CleanUpString } from '@/lib/strings';
import { KeySet, KeySetInstance } from '@/types/keyset';
import { useState } from 'react';
import { FilterByPrimaryRole } from './helpers/filtering';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Edit3Icon, ScatterChartIcon } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getLocalCachedPrefs, setLocalCachedPrefs } from '@/lib/local_storage';
import { FolderHandleContextType } from '@/context/folder-context';
import { Link, redirect, useLoaderData } from 'react-router-dom';
import createHref from '@/lib/links';
import ProportionFigureVisualization from './figures/proportion-figure';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BackButton from '@/components/ui/back-button';

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
};

export const resultsViewerProportion = (ctx: FolderHandleContextType) => {
  const { handle } = ctx;

  // @ts-ignore
  return async ({ params, request }) => {
    const { Group, Individual, Evaluation } = params;

    if (!Group || !Individual || !Evaluation || !handle) {
      const response = redirect(createHref({ type: 'Dashboard' }));
      throw response;
    }

    const { keyset, results } = await GetResultsFromEvaluationFolder(handle, Group, Individual, Evaluation);

    if (!keyset) {
      const response = redirect(createHref({ type: 'Dashboard' }));
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

    const keys = dynamic_keyset.DurationKeys.map((key) => ({
      KeyDescription: key.KeyDescription,
      Visible: true,
    }));

    const stored_prefs = getLocalCachedPrefs(Group, Individual, Evaluation, 'Duration');

    const show_keys_base = keys.map((key) => {
      const should_disable = stored_prefs.KeyDescription.includes(key.KeyDescription);

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
      Schedule: stored_prefs.Schedule ?? 'End on Timer #1',
    } satisfies LoaderResult;
  };
};

export default function ResultsProportionVisualsPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Evaluation, ShowKeys, DynamicKeySet, Results, Schedule } = loaderResult;
  const [filteredKeys, setFilteredKeys] = useState(ShowKeys);
  const [schedule, setSchedule] = useState<SessionTerminationOptionsType>(Schedule);

  const results_filtered = FilterByPrimaryRole(Results);

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(CleanUpString(Group)),
        BuildEvaluationsBreadcrumb(CleanUpString(Group), CleanUpString(Individual)),
      ]}
      label={`${CleanUpString(CleanUpString(Evaluation))}: Interval Proportions`}
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
                type: 'Evaluation Visualizer-Rate',
                group: Group,
                individual: Individual,
                evaluation: Evaluation,
              })}
            >
              <Button variant={'outline'} className="shadow" size={'sm'}>
                <ScatterChartIcon className="mr-2 h-4 w-4" />
                See Rate
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
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-fit">
                  <Edit3Icon className="mr-2 w-4 h-4" />
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

                      setLocalCachedPrefs(Group, Individual, Evaluation, 'Duration', {
                        KeyDescription: hidden_keys,
                        CTBElements: [],
                        Schedule: schedule,
                      });
                    }}
                  >
                    {key.KeyDescription}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex flex-row items-center gap-2 w-fit">
              <p>Select Timer to Reference:</p>
              <Select
                value={schedule}
                onValueChange={(value: SessionTerminationOptionsType) => {
                  setSchedule(value);

                  const hidden_keys = filteredKeys.filter((k) => k.Visible === false).map((k) => k.KeyDescription);

                  setLocalCachedPrefs(Group, Individual, Evaluation, 'Duration', {
                    KeyDescription: hidden_keys,
                    CTBElements: [],
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
            This page provides a visual of the available data regarding <i>proportion of session time</i>. For
            convenience, series of data can be enabled or disabled for viewing. Options set here will persist for future
            visits.
          </p>

          {DynamicKeySet && (
            <ProportionFigureVisualization
              FilteredSessions={results_filtered}
              ScheduleOption={schedule}
              KeySetFull={filteredKeys}
            />
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
