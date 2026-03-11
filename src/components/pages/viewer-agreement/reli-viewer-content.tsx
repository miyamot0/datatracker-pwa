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

type KeyedReli = {
  KeyName: string;
  Value: number;
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

  const EIA_f_values: KeyedReli[] = [];
  const PIA_f_values: KeyedReli[] = [];
  const TIA_f_values: KeyedReli[] = [];
  const OIA_f_values: KeyedReli[] = [];
  const NIA_f_values: KeyedReli[] = [];
  const PMA_f_values: KeyedReli[] = [];

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

      EIA_f_values.push({ Value: EIA, KeyName: key.KeyName });
      PIA_f_values.push({ Value: PIA, KeyName: key.KeyName });
      TIA_f_values.push({ Value: TIA, KeyName: key.KeyName });
      OIA_f_values.push({ Value: OIA, KeyName: key.KeyName });
      NIA_f_values.push({ Value: NIA, KeyName: key.KeyName });
      PMA_f_values.push({ Value: PMA, KeyName: key.KeyName });

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

  recent_keyset.FrequencyKeys.forEach((key) => {
    const relevantEIA_f_values = EIA_f_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantPIA_f_values = PIA_f_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantTIA_f_values = TIA_f_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantOIA_f_values = OIA_f_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantNIA_f_values = NIA_f_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantPMA_f_values = PMA_f_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );

    mean_f_row.push({
      value: (relevantEIA_f_values.reduce((a, b) => a + b, 0) / relevantEIA_f_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_f_row.push({
      value: (relevantPIA_f_values.reduce((a, b) => a + b, 0) / relevantPIA_f_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_f_row.push({
      value: (relevantTIA_f_values.reduce((a, b) => a + b, 0) / relevantTIA_f_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_f_row.push({
      value: (relevantOIA_f_values.reduce((a, b) => a + b, 0) / relevantOIA_f_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_f_row.push({
      value: (relevantNIA_f_values.reduce((a, b) => a + b, 0) / relevantNIA_f_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_f_row.push({
      value: (relevantPMA_f_values.reduce((a, b) => a + b, 0) / relevantPMA_f_values.length).toFixed(2) ?? '',
      readOnly: true,
    });
  });

  f_rows.push(mean_f_row);

  const EIA_d_values: KeyedReli[] = [];
  const PIA_d_values: KeyedReli[] = [];
  const TIA_d_values: KeyedReli[] = [];
  const OIA_d_values: KeyedReli[] = [];
  const NIA_d_values: KeyedReli[] = [];
  const PMA_d_values: KeyedReli[] = [];

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

      EIA_d_values.push({ KeyName: key.KeyName, Value: EIA });
      PIA_d_values.push({ KeyName: key.KeyName, Value: PIA });
      TIA_d_values.push({ KeyName: key.KeyName, Value: TIA });
      OIA_d_values.push({ KeyName: key.KeyName, Value: OIA });
      NIA_d_values.push({ KeyName: key.KeyName, Value: NIA });
      PMA_d_values.push({ KeyName: key.KeyName, Value: PMA });

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

  recent_keyset.DurationKeys.forEach((key) => {
    const relevantEIA_d_values = EIA_d_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantPIA_d_values = PIA_d_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantTIA_d_values = TIA_d_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantOIA_d_values = OIA_d_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantNIA_d_values = NIA_d_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantPMA_d_values = PMA_d_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );

    mean_d_row.push({
      value: (relevantEIA_d_values.reduce((a, b) => a + b, 0) / relevantEIA_d_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_d_row.push({
      value: (relevantPIA_d_values.reduce((a, b) => a + b, 0) / relevantPIA_d_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_d_row.push({
      value: (relevantTIA_d_values.reduce((a, b) => a + b, 0) / relevantTIA_d_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_d_row.push({
      value: (relevantOIA_d_values.reduce((a, b) => a + b, 0) / relevantOIA_d_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_d_row.push({
      value: (relevantNIA_d_values.reduce((a, b) => a + b, 0) / relevantNIA_d_values.length).toFixed(2) ?? '',
      readOnly: true,
    });

    mean_d_row.push({
      value: (relevantPMA_d_values.reduce((a, b) => a + b, 0) / relevantPMA_d_values.length).toFixed(2) ?? '',
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
