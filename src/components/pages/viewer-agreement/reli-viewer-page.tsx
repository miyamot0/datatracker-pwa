import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingDisplay from '@/components/ui/loading-display';
import { FolderHandleContext } from '@/context/folder-context';
import { SavedSessionResult } from '@/lib/dtos';
import { castSavedFilesToSessionResults } from '@/lib/files';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { KeySet } from '@/types/keyset';
import { ScoredKey } from '@/types/reli';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Spreadsheet from 'react-spreadsheet';
import ReliabilityBlank from './alternates/reli-blank';
import { calculateReliabilityDuration, calculateReliabilityFrequency, getCorrespondingSessionPairs } from '@/lib/reli';

export function ReliabilityViewerPageShim() {
  const { handle } = useContext(FolderHandleContext);
  const [results, setResults] = useState<SavedSessionResult[]>([]);
  const [keySet, setKeySet] = useState<KeySet>();
  const navigate = useNavigate();

  const { Group, Individual, Evaluation } = useParams();

  useEffect(() => {
    if (!handle || !Group || !Individual || !Evaluation) {
      navigate(createHref({ type: 'Dashboard' }), {
        unstable_viewTransition: true,
      });
      return;
    }

    const returner = async () => {
      const result = await castSavedFilesToSessionResults(
        handle,
        CleanUpString(Group!),
        CleanUpString(Individual!),
        CleanUpString(Evaluation!)
      );

      if (result.length > 0) {
        const time_sorted = result.sort(
          (a, b) => new Date(a.SessionStart).getTime() - new Date(b.SessionStart).getTime()
        );

        // Most recent keyset
        setKeySet(time_sorted.slice(-1)[0].Keyset);
      }

      setResults(result);
    };

    returner();
  }, [Evaluation, Group, Individual, handle, navigate]);

  if (!handle) return <LoadingDisplay />;

  if (handle && !keySet) {
    return (
      <ReliabilityBlank
        Group={CleanUpString(Group!)}
        Individual={CleanUpString(Individual!)}
        Evaluation={CleanUpString(Evaluation!)}
      />
    );
  }

  const results_primary = results
    .sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session)
    .filter((result) => result.SessionSettings.Role === 'Primary');

  const results_reli = results
    .sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session)
    .filter((result) => result.SessionSettings.Role === 'Reliability');

  const pairedSessionData = getCorrespondingSessionPairs(results_primary, results_reli);

  const sessions_scored_frequency = pairedSessionData.map((pair) =>
    calculateReliabilityFrequency(pair, keySet!.FrequencyKeys)
  );

  const sessions_scored_duration = pairedSessionData.map((pair) =>
    calculateReliabilityDuration(pair, keySet!.DurationKeys)
  );

  const sessions = pairedSessionData
    .map((pair) => pair.primary.SessionSettings.Session)
    .filter((value, index, array) => {
      return array.indexOf(value) === index;
    });

  return (
    <ReliabilityViewerPage
      Group={CleanUpString(Group!)}
      Individual={CleanUpString(Individual!)}
      Evaluation={CleanUpString(Evaluation!)}
      Keyset={keySet!}
      Sessions={sessions}
      ScoredFrequency={sessions_scored_frequency}
      ScoredDuration={sessions_scored_duration}
    />
  );
}

type Props = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Keyset: KeySet;
  Sessions: number[];
  ScoredFrequency: ScoredKey[][];
  ScoredDuration: ScoredKey[][];
};

function ReliabilityViewerPage({
  Group,
  Individual,
  Evaluation,
  Keyset,
  Sessions,
  ScoredFrequency,
  ScoredDuration,
}: Props) {
  const f_headings = Keyset.FrequencyKeys.flatMap((key) => {
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

    Keyset.FrequencyKeys.forEach((key) => {
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

  const d_headings = Keyset.DurationKeys.flatMap((key) => {
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

    Keyset.DurationKeys.forEach((key) => {
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
    >
      <div className="flex flex-col w-full gap-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Reliability Estimates: Frequency</CardTitle>
            <CardDescription>Estimates of various indices are presented below in 10s bins</CardDescription>
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
          <CardHeader>
            <CardTitle>Reliability Estimates: Duration</CardTitle>
            <CardDescription>Estimates of various indices are presented below in 10s bins</CardDescription>
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
