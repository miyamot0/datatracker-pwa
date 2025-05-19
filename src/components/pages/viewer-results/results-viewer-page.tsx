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
import { KeySet } from '@/types/keyset';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@/components/ui/select';
import { useState } from 'react';
import ViewFrequencyResults from './views/view-frequency-results';
import ViewDurationResults from './views/view-duration-results';
import { FolderHandleContextType } from '@/context/folder-context';
import { redirect, useLoaderData } from 'react-router-dom';
import createHref from '@/lib/links';

type LoaderResult = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Handle: FileSystemHandle;
  Keyset: KeySet;
  Results: SavedSessionResult[];
};

export const resultsViewerLoader = (ctx: FolderHandleContextType) => {
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

    return {
      Group: CleanUpString(Group),
      Individual: CleanUpString(Individual),
      Evaluation: CleanUpString(Evaluation),
      Handle: handle,
      Keyset: keyset,
      Results: results,
    } satisfies LoaderResult;
  };
};

export default function ResultsViewerPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Evaluation, Results, Keyset } = loaderResult;

  const [role, setRole] = useState<DataCollectorRolesType>('Primary');

  const results_filtered = Results.sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session).filter(
    (result) => result.SessionSettings.Role === role
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
        <div className="flex flex-row items-center">
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
        </div>

        {Keyset && Keyset.FrequencyKeys.length > 0 && (
          <ViewFrequencyResults Keyset={Keyset} Results={results_filtered} />
        )}

        {Keyset && Keyset.DurationKeys.length > 0 && <ViewDurationResults Keyset={Keyset} Results={results_filtered} />}
      </div>
    </PageWrapper>
  );
}
