import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { DataCollectorRolesType } from '@/forms/schema/session-designer-schema';
import { SavedSessionResult } from '@/lib/dtos';
import { GetResultsFromEvaluationFolder } from '@/lib/files';
import { CleanUpString } from '@/lib/strings';
import { KeySet, KeySetInstance } from '@/types/keyset';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@/components/ui/select';
import { useState } from 'react';
import ViewFrequencyResults from './views/view-frequency-results';
import ViewDurationResults from './views/view-duration-results';
import { FolderHandleContextType } from '@/context/folder-context';
import { redirect, useLoaderData } from 'react-router-dom';
import createHref from '@/lib/links';
import { toast } from 'sonner';
import { SessionTerminationOptions } from '@/forms/schema/session-designer-schema';
import { getLocalCachedPrefs } from '@/lib/local_storage';

export type EnhancedKeySetInstance = KeySetInstance & { Visible: boolean; Type: 'Key' | 'Summary' };

type LoaderResult = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Handle: FileSystemHandle;
  Keyset: KeySet;
  Results: SavedSessionResult[];
  UnfilteredKeySetF: EnhancedKeySetInstance[];
  UnfilteredKeySetD: EnhancedKeySetInstance[];
  ExcludeFromCTB: {
    KeyDescription: string;
    Visible: boolean;
  }[];
  ScheduleMappingDefault: ScheduleMappingOptionsType;
};

const ScheduleMappingOptions = [
  {
    value: SessionTerminationOptions.TimerMain,
    label: 'Score Total Time',
  },
  {
    value: SessionTerminationOptions.Timer1,
    label: 'Score Timer #1 Time',
  },
  {
    value: SessionTerminationOptions.Timer2,
    label: 'Score Timer #2 Time',
  },
  {
    value: SessionTerminationOptions.Timer3,
    label: 'Score Timer #3 Time',
  },
];

type ScheduleMappingOptionsType = (typeof ScheduleMappingOptions)[number];

// eslint-disable-next-line react-refresh/only-export-components
export const resultsViewerLoader = (ctx: FolderHandleContextType) => {
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

    const stored_prefs_F = getLocalCachedPrefs(Group, Individual, Evaluation, 'Rate');

    const enhancedKeySetF: EnhancedKeySetInstance[] = keyset.FrequencyKeys.map((key) => ({
      ...key,
      Visible: true,
      Type: 'Key',
    }));

    const ctbEntry = {
      KeyCode: -1,
      KeyDescription: 'CTB',
      KeyName: 'CTB',
      Visible: true,
      Type: 'Summary',
    } satisfies EnhancedKeySetInstance;

    const baseUnfilteredKeysF = [...enhancedKeySetF, ctbEntry].map((key) => {
      const should_disable = stored_prefs_F.KeyDescription.includes(key.KeyDescription);

      if (should_disable) {
        return {
          ...key,
          Visible: false,
        } satisfies EnhancedKeySetInstance;
      }

      return key;
    });

    const excludeFromCTB = baseUnfilteredKeysF.map((key) => {
      const should_disable = stored_prefs_F.CTBElements.includes(key.KeyDescription);

      if (should_disable) {
        return {
          ...key,
          Visible: false,
        };
      }

      return key;
    });

    const stored_prefs_D = getLocalCachedPrefs(Group, Individual, Evaluation, 'Duration');

    const enhancedKeySetD: EnhancedKeySetInstance[] = keyset.DurationKeys.map((key) => ({
      ...key,
      Visible: true,
      Type: 'Key',
    }));

    const baseUnfilteredKeysD = enhancedKeySetD.map((key) => {
      const should_disable = stored_prefs_D.KeyDescription.includes(key.KeyDescription);

      if (should_disable) {
        return {
          ...key,
          Visible: false,
        } satisfies EnhancedKeySetInstance;
      }

      return key;
    });

    const timerMapping =
      ScheduleMappingOptions.find((i) => i.value === stored_prefs_F?.Schedule) ?? ScheduleMappingOptions[0];

    return {
      Group: CleanUpString(Group),
      Individual: CleanUpString(Individual),
      Evaluation: CleanUpString(Evaluation),
      Handle: handle,
      Keyset: keyset,
      Results: results,
      UnfilteredKeySetF: baseUnfilteredKeysF,
      UnfilteredKeySetD: baseUnfilteredKeysD,
      ExcludeFromCTB: excludeFromCTB,
      ScheduleMappingDefault: timerMapping,
    } satisfies LoaderResult;
  };
};

export default function ResultsViewerPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const {
    Group,
    Individual,
    Evaluation,
    Results,
    Keyset,
    UnfilteredKeySetF,
    ExcludeFromCTB,
    UnfilteredKeySetD,
    ScheduleMappingDefault,
  } = loaderResult;

  const [role, setRole] = useState<DataCollectorRolesType>('Primary');
  const [schedule, setSchedule] = useState<ScheduleMappingOptionsType>(ScheduleMappingDefault);
  const results_filtered = Results.sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session).filter(
    (result) => result.SessionSettings.Role === role,
  );

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(CleanUpString(Group)),
        BuildEvaluationsBreadcrumb(CleanUpString(Group), CleanUpString(Individual)),
      ]}
      label={`View ${CleanUpString(CleanUpString(Evaluation))} Data`}
      className="select-none"
    >
      <div className="flex flex-col w-full gap-4">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-2">
            <p>Filter by Data Collector:</p>
            <Select
              value={role}
              onValueChange={(value: DataCollectorRolesType) => {
                setRole(value);
              }}
            >
              <SelectTrigger className="w-fit">
                <SelectValue placeholder="Data Collector Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Primary">Primary Data Collector</SelectItem>
                  <SelectItem value="Reliability">Reliability Data Collector</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-center gap-2">
            <p>Score By Schedule:</p>
            <Select
              value={schedule.value}
              onValueChange={(value: ScheduleMappingOptionsType['value']) => {
                const selectedOption = ScheduleMappingOptions.find((option) => option.value === value);
                if (selectedOption) {
                  setSchedule(selectedOption);
                }
              }}
            >
              <SelectTrigger className="w-fit">
                <SelectValue placeholder="Timer Scoring" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ScheduleMappingOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {Keyset && Keyset.FrequencyKeys.length > 0 && (
          <ViewFrequencyResults
            SessionTimer={schedule.value}
            Results={results_filtered}
            ExcludeFromCTB={ExcludeFromCTB}
            UnfilteredKeyList={UnfilteredKeySetF}
          />
        )}

        {Keyset && Keyset.DurationKeys.length > 0 && (
          <ViewDurationResults
            SessionTimer={schedule.value}
            Results={results_filtered}
            UnfilteredKeyList={UnfilteredKeySetD}
          />
        )}
      </div>
    </PageWrapper>
  );
}
