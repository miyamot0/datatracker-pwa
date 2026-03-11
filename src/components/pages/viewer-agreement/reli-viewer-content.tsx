import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import createHref from '@/lib/links';
import Spreadsheet from 'react-spreadsheet';
import { calculateReliabilityDuration, calculateReliabilityFrequency, getCorrespondingSessionPairs } from '@/lib/reli';
import BackButton from '@/components/ui/back-button';
import { ModifiedSessionResult } from '@/types/storage';

type Props = {
  Group: string;
  Individual: string;
  Results: ModifiedSessionResult[];
};

export default function ReliabilityViewerContent({ Group, Individual, Results }: Props) {
  const recent_keyset = Results.slice(-1)[0].Keyset;

  const results_primary = Results.sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session).filter(
    (result) => result.SessionSettings.Role === 'Primary',
  );

  const results_reli = Results.sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session).filter(
    (result) => result.SessionSettings.Role === 'Reliability',
  );

  const pairedSessionData = getCorrespondingSessionPairs(results_primary, results_reli);

  const sessions_scored_frequency = pairedSessionData.map((pair) =>
    calculateReliabilityFrequency(pair, recent_keyset.FrequencyKeys),
  );

  const sessions_scored_duration = pairedSessionData.map((pair) =>
    calculateReliabilityDuration(pair, recent_keyset.DurationKeys),
  );

  const sessions = pairedSessionData
    .map((pair) => pair.primary.SessionSettings.Session)
    .filter((value, index, array) => {
      return array.indexOf(value) === index;
    });

  const f_headings = recent_keyset.FrequencyKeys.flatMap((key) => {
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

  const EIA_f_values: number[] = [];
  const PIA_f_values: number[] = [];
  const TIA_f_values: number[] = [];
  const OIA_f_values: number[] = [];
  const NIA_f_values: number[] = [];
  const PMA_f_values: number[] = [];

  const f_rows = sessions.map((session) => {
    const temp_array = [{ value: session.toString(), readOnly: true }];

    recent_keyset.FrequencyKeys.forEach((key) => {
      const session_to_show = sessions_scored_frequency
        .flat()
        .find((s) => s.Session === session && s.KeyName === key.KeyName);

      if (!session_to_show) {
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        return;
      }

      const { EIA, PIA, TIA, OIA, NIA, PMA } = session_to_show;

      EIA_f_values.push(EIA);
      PIA_f_values.push(PIA);
      TIA_f_values.push(TIA);
      OIA_f_values.push(OIA);
      NIA_f_values.push(NIA);
      PMA_f_values.push(PMA);

      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (temp_array.push({
        value: EIA.toFixed(2) ?? '',
        readOnly: true,
      }),
        temp_array.push({
          value: PIA.toFixed(2) ?? '',
          readOnly: true,
        }),
        temp_array.push({
          value: TIA.toFixed(2) ?? '',
          readOnly: true,
        }),
        temp_array.push({
          value: OIA.toFixed(2) ?? '',
          readOnly: true,
        }),
        temp_array.push({
          value: NIA.toFixed(2) ?? '',
          readOnly: true,
        }),
        temp_array.push({
          value: PMA.toFixed(2) ?? '',
          readOnly: true,
        }));
    });

    return temp_array;
  });

  const mean_f_row = [{ value: 'Averaged', readOnly: true }];

  console.log(EIA_f_values);

  recent_keyset.FrequencyKeys.forEach(() => {
    mean_f_row.push({
      value: (EIA_f_values.reduce((a, b) => a + b, 0) / EIA_f_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_f_row.push({
      value: (PIA_f_values.reduce((a, b) => a + b, 0) / PIA_f_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_f_row.push({
      value: (TIA_f_values.reduce((a, b) => a + b, 0) / TIA_f_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_f_row.push({
      value: (OIA_f_values.reduce((a, b) => a + b, 0) / OIA_f_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_f_row.push({
      value: (NIA_f_values.reduce((a, b) => a + b, 0) / NIA_f_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_f_row.push({
      value: (PMA_f_values.reduce((a, b) => a + b, 0) / PMA_f_values.length).toFixed(2) ?? '',
      readOnly: true,
    });
  });

  f_rows.push(mean_f_row);

  const EIA_d_values: number[] = [];
  const PIA_d_values: number[] = [];
  const TIA_d_values: number[] = [];
  const OIA_d_values: number[] = [];
  const NIA_d_values: number[] = [];
  const PMA_d_values: number[] = [];

  const d_headings = recent_keyset.DurationKeys.flatMap((key) => {
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

  const d_rows = sessions.map((session) => {
    const temp_array = [{ value: session.toString(), readOnly: true }];

    recent_keyset.DurationKeys.forEach((key) => {
      const session_to_show = sessions_scored_duration
        .flat()
        .find((s) => s.Session === session && s.KeyName === key.KeyName);

      if (!session_to_show) {
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        return;
      }

      const { EIA, PIA, TIA, OIA, NIA, PMA } = session_to_show;

      EIA_d_values.push(EIA);
      PIA_d_values.push(PIA);
      TIA_d_values.push(TIA);
      OIA_d_values.push(OIA);
      NIA_d_values.push(NIA);
      PMA_d_values.push(PMA);

      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (temp_array.push({
        value: EIA.toFixed(2) ?? '',
        readOnly: true,
      }),
        temp_array.push({
          value: PIA.toFixed(2) ?? '',
          readOnly: true,
        }),
        temp_array.push({
          value: TIA.toFixed(2) ?? '',
          readOnly: true,
        }),
        temp_array.push({
          value: OIA.toFixed(2) ?? '',
          readOnly: true,
        }),
        temp_array.push({
          value: NIA.toFixed(2) ?? '',
          readOnly: true,
        }),
        temp_array.push({
          value: PMA.toFixed(2) ?? '',
          readOnly: true,
        }));
    });

    return temp_array;
  });

  const mean_d_row = [{ value: 'Averaged', readOnly: true }];

  recent_keyset.FrequencyKeys.forEach(() => {
    mean_d_row.push({
      value: (EIA_d_values.reduce((a, b) => a + b, 0) / EIA_d_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_d_row.push({
      value: (PIA_d_values.reduce((a, b) => a + b, 0) / PIA_d_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_d_row.push({
      value: (TIA_d_values.reduce((a, b) => a + b, 0) / TIA_d_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_d_row.push({
      value: (OIA_d_values.reduce((a, b) => a + b, 0) / OIA_d_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_d_row.push({
      value: (NIA_d_values.reduce((a, b) => a + b, 0) / NIA_d_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_d_row.push({
      value: (PMA_d_values.reduce((a, b) => a + b, 0) / PMA_d_values.length).toFixed(2) ?? '',
      readOnly: true,
    });
  });

  d_rows.push(mean_d_row);

  return (
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
  );
}
