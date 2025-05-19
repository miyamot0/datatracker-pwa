import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderHandleContextType } from '@/context/folder-context';
import { SavedSessionResult } from '@/lib/dtos';
import { castSavedFilesToSessionResults } from '@/lib/files';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { KeySet } from '@/types/keyset';
import { ScoredKey } from '@/types/reli';
import { redirect, useLoaderData } from 'react-router-dom';
import Spreadsheet from 'react-spreadsheet';
import ReliabilityBlank from './alternates/reli-blank';
import { calculateReliabilityDuration, calculateReliabilityFrequency, getCorrespondingSessionPairs } from '@/lib/reli';
import BackButton from '@/components/ui/back-button';

type LoaderResult = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Handle: FileSystemHandle;
  Results: SavedSessionResult[];
  KeySet?: KeySet;
  Sessions?: number[];
  ScoredFrequency?: ScoredKey[][];
  ScoredDuration?: ScoredKey[][];
};

export const reliViewerLoader = (ctx: FolderHandleContextType) => {
  const { handle } = ctx;

  // @ts-ignore
  return async ({ params, request }) => {
    const { Group, Individual, Evaluation } = params;

    if (!Group || !Individual || !Evaluation || !handle) {
      const response = redirect(createHref({ type: 'Dashboard' }));
      throw response;
    }

    const result = await castSavedFilesToSessionResults(
      handle,
      CleanUpString(Group!),
      CleanUpString(Individual!),
      CleanUpString(Evaluation!)
    );

    if (result.length === 0) {
      return {
        Group: CleanUpString(Group!),
        Individual: CleanUpString(Individual!),
        Evaluation: CleanUpString(Evaluation!),
        Handle: handle,
        Results: result,
      } satisfies LoaderResult;
    }

    const sorted_results = result.sort(
      (a, b) => new Date(a.SessionStart).getTime() - new Date(b.SessionStart).getTime()
    );

    const recent_keyset = sorted_results.slice(-1)[0].Keyset;

    const results_primary = result
      .sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session)
      .filter((result) => result.SessionSettings.Role === 'Primary');

    const results_reli = result
      .sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session)
      .filter((result) => result.SessionSettings.Role === 'Reliability');

    const pairedSessionData = getCorrespondingSessionPairs(results_primary, results_reli);

    const sessions_scored_frequency = pairedSessionData.map((pair) =>
      calculateReliabilityFrequency(pair, recent_keyset.FrequencyKeys)
    );

    const sessions_scored_duration = pairedSessionData.map((pair) =>
      calculateReliabilityDuration(pair, recent_keyset.DurationKeys)
    );

    const sessions = pairedSessionData
      .map((pair) => pair.primary.SessionSettings.Session)
      .filter((value, index, array) => {
        return array.indexOf(value) === index;
      });

    return {
      Group: CleanUpString(Group!),
      Individual: CleanUpString(Individual!),
      Evaluation: CleanUpString(Evaluation!),
      Handle: handle,
      Results: sorted_results,
      KeySet: recent_keyset,
      Sessions: sessions,
      ScoredFrequency: sessions_scored_frequency,
      ScoredDuration: sessions_scored_duration,
    } satisfies LoaderResult;
  };
};

export default function ReliabilityViewerPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Evaluation, KeySet, Sessions, ScoredDuration, ScoredFrequency } = loaderResult;

  if (!KeySet || !Sessions || !ScoredFrequency || !ScoredDuration) {
    return (
      <ReliabilityBlank
        Group={CleanUpString(Group!)}
        Individual={CleanUpString(Individual!)}
        Evaluation={CleanUpString(Evaluation!)}
      />
    );
  }

  const f_headings = KeySet.FrequencyKeys.flatMap((key) => {
    return [
      `${key.KeyDescription} (EIA)`,
      `${key.KeyDescription} (PIA)`,
      `${key.KeyDescription} (TIA)`,
      `${key.KeyDescription} (OIA)`,
      `${key.KeyDescription} (NIA)`,
      `${key.KeyDescription} (PMA)`,
    ];
  });

  f_headings.unshift('Session #');

  const f_rows = Sessions.map((session) => {
    const temp_array = [{ value: session.toString(), readOnly: true }];

    KeySet.FrequencyKeys.forEach((key) => {
      const session_to_show = ScoredFrequency.flat().find((s) => s.Session === session && s.KeyName === key.KeyName);

      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      temp_array.push({
        value: session_to_show?.EIA.toFixed(2) ?? '',
        readOnly: true,
      }),
        temp_array.push({
          value: session_to_show?.PIA.toFixed(2) ?? '',
          readOnly: true,
        }),
        temp_array.push({
          value: session_to_show?.TIA.toFixed(2) ?? '',
          readOnly: true,
        }),
        temp_array.push({
          value: session_to_show?.OIA.toFixed(2) ?? '',
          readOnly: true,
        }),
        temp_array.push({
          value: session_to_show?.NIA.toFixed(2) ?? '',
          readOnly: true,
        }),
        temp_array.push({
          value: session_to_show?.PMA.toFixed(2) ?? '',
          readOnly: true,
        });
    });

    return temp_array;
  });

  const d_headings = KeySet.DurationKeys.flatMap((key) => {
    return [
      `${key.KeyDescription} (EIA)`,
      `${key.KeyDescription} (PIA)`,
      `${key.KeyDescription} (TIA)`,
      `${key.KeyDescription} (OIA)`,
      `${key.KeyDescription} (NIA)`,
      `${key.KeyDescription} (PMA)`,
    ];
  });

  d_headings.unshift('Session #');

  const d_rows = Sessions.map((session) => {
    const temp_array = [{ value: session.toString(), readOnly: true }];

    KeySet.DurationKeys.forEach((key) => {
      const session_to_show = ScoredDuration.flat().find((s) => s.Session === session && s.KeyName === key.KeyName);

      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      temp_array.push({
        value: session_to_show?.EIA.toFixed(2) ?? '',
        readOnly: true,
      }),
        temp_array.push({
          value: session_to_show?.PIA.toFixed(2) ?? '',
          readOnly: true,
        }),
        temp_array.push({
          value: session_to_show?.TIA.toFixed(2) ?? '',
          readOnly: true,
        }),
        temp_array.push({
          value: session_to_show?.OIA.toFixed(2) ?? '',
          readOnly: true,
        }),
        temp_array.push({
          value: session_to_show?.NIA.toFixed(2) ?? '',
          readOnly: true,
        }),
        temp_array.push({
          value: session_to_show?.PMA.toFixed(2) ?? '',
          readOnly: true,
        });
    });

    return temp_array;
  });

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
      ]}
      label={`Reliability for ${CleanUpString(Evaluation)}`}
      className="select-none"
    >
      <div className="flex flex-col w-full gap-4">
        <Card className="w-full">
          <CardHeader className="flex flex-row justify-between">
            <div className="flex flex-col gap-1.5 grow">
              <CardTitle>Reliability Estimates: Frequency</CardTitle>
              <CardDescription>Estimates of various indices are presented below in 10s bins</CardDescription>
            </div>
            <BackButton
              Label="Back to Evaluations"
              Href={createHref({ type: 'Evaluations', group: Group, individual: Individual })}
            />
          </CardHeader>

          <CardContent className="overflow-x-auto">
            <Spreadsheet
              data={f_rows}
              columnLabels={f_headings}
              onKeyDown={(ev) => {
                if (ev.key.toLocaleLowerCase() === 'v') ev.preventDefault();
              }}
            />
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row justify-between">
            <div className="flex flex-col gap-1.5 grow">
              <CardTitle>Reliability Estimates: Duration</CardTitle>
              <CardDescription>Estimates of various indices are presented below in 10s bins</CardDescription>
            </div>
            <BackButton
              Label="Back to Evaluations"
              Href={createHref({ type: 'Evaluations', group: Group, individual: Individual })}
            />
          </CardHeader>

          <CardContent className="overflow-x-auto">
            <Spreadsheet
              data={d_rows}
              columnLabels={d_headings}
              onKeyDown={(ev) => {
                if (ev.key.toLocaleLowerCase() === 'v') ev.preventDefault();
              }}
            />
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
