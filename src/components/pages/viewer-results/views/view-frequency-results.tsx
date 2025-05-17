import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SavedSessionResult } from '@/lib/dtos';
import { KeySet } from '@/types/keyset';
import { Code2Icon, TableIcon } from 'lucide-react';
import { exportHumanReadableToCSV } from '@/lib/download';
import { EntryHolder, HumanReadableResults, HumanReadableResultsRow } from '@/types/export';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import Spreadsheet, { CellBase, Matrix } from 'react-spreadsheet';
import { walkSessionFrequencyKey } from '../helpers/schedule_parser';
import BackButton from '@/components/ui/back-button';
import createHref from '@/lib/links';
import { useParams } from 'react-router-dom';

type Props = {
  Keyset: KeySet;
  Results: SavedSessionResult[];
};

export default function ViewFrequencyResults({ Keyset, Results }: Props) {
  const { Group, Individual } = useParams();

  const hr_results: HumanReadableResults = {
    type: 'Frequency',
    keys: Keyset.FrequencyKeys.map((key) => ({
      Key: key.KeyName,
      Value: key.KeyDescription,
    })),

    results: [],
  };

  Results.map((result) => {
    const system_events = result.SystemKeyPresses.map((press) => new Date(press.TimePressed)).sort(
      (a, b) => a.getTime() - b.getTime()
    );

    if (system_events.length === 0) throw new Error('No system events found');

    const temp_result = {
      Session: result.SessionSettings.Session,
      Date: system_events[0],
      Condition: result.SessionSettings.Condition,
      DataCollector: result.SessionSettings.Initials,
      Therapist: result.SessionSettings.Therapist,
      values: [] as EntryHolder[],
      duration: result.TimerMain / 60,
      Timer1: result.TimerOne / 60,
      Timer2: result.TimerTwo / 60,
      Timer3: result.TimerThree / 60,
    } satisfies HumanReadableResultsRow;

    Keyset.FrequencyKeys.map((key) => {
      const primary = walkSessionFrequencyKey(result, 'Primary', key);
      const secondary = walkSessionFrequencyKey(result, 'Secondary', key);
      const tertiary = walkSessionFrequencyKey(result, 'Tertiary', key);

      const score_by_schedule = [primary, secondary, tertiary];

      const total_frequency = score_by_schedule.reduce((partialSum, a) => partialSum + a.Value, 0);

      temp_result.values.push({
        Key: key.KeyDescription,
        Value: (primary.Value / (result.TimerOne / 60)).toFixed(2),
      });

      temp_result.values.push({
        Key: key.KeyDescription,
        Value: (secondary.Value / (result.TimerTwo / 60)).toFixed(2),
      });

      temp_result.values.push({
        Key: key.KeyDescription,
        Value: (tertiary.Value / (result.TimerThree / 60)).toFixed(2),
      });

      temp_result.values.push({
        Key: key.KeyDescription,
        Value: total_frequency.toString(),
      });
    });

    hr_results.results.push(temp_result);
  });

  const csv_string = exportHumanReadableToCSV(hr_results);

  const columnLabels = ['Session #', 'Date', 'Time', 'Condition', 'Data Collector', 'Therapist'];
  hr_results.keys.forEach((entry) => {
    columnLabels.push(entry.Value + ' (Rate; Timer #1 Basis)');
    columnLabels.push(entry.Value + ' (Rate; Timer #2 Basis)');
    columnLabels.push(entry.Value + ' (Rate; Timer #3 Basis)');
    columnLabels.push(entry.Value + ' (Total Count)');
  });
  columnLabels.push('Main Timer (Min)');
  columnLabels.push('Timer #1 (Min)');
  columnLabels.push('Timer #2 (Min)');
  columnLabels.push('Timer #3 (Min)');

  const data = hr_results.results.map((datum) => {
    const values = datum.values.map((datum2) => {
      return {
        value: datum2.Value.toString(),
        readOnly: true,
      };
    });

    return [
      { value: datum.Session.toString(), readOnly: true },
      { value: datum.Date.toLocaleDateString(), readOnly: true },
      { value: datum.Date.toLocaleTimeString(), readOnly: true },
      { value: datum.Condition.toString(), readOnly: true },
      { value: datum.DataCollector.toString(), readOnly: true },
      { value: datum.Therapist.toString(), readOnly: true },
      ...values,
      { value: datum.duration.toFixed(2), readOnly: true },
      { value: datum.Timer1.toFixed(2), readOnly: true },
      { value: datum.Timer2.toFixed(2), readOnly: true },
      { value: datum.Timer3.toFixed(2), readOnly: true, mode: 'view' },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as Matrix<CellBase<any>>;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Summary of Session Frequency Data</CardTitle>
          <CardDescription>Key Presses are summarized in the table below</CardDescription>
        </div>
        <div className="flex flex-row gap-2">
          <ToolTipWrapper Label="Download data as CSV">
            <Button
              size={'sm'}
              variant={'outline'}
              onClick={() => {
                const link = document.createElement('a');
                const csvData = new Blob([csv_string], {
                  type: 'text/csv',
                });
                const csvURL = URL.createObjectURL(csvData);
                link.href = csvURL;
                link.download = `DataTracker Results ${new Date().toLocaleDateString()}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex flex-row gap-2"
            >
              <TableIcon className="h-4 w-4" />
              Download
            </Button>
          </ToolTipWrapper>

          <ToolTipWrapper Label="Download data as JSON">
            <Button
              size={'sm'}
              variant={'outline'}
              onClick={() => {
                const link = document.createElement('a');
                const jsonData = new Blob([JSON.stringify(hr_results)], {
                  type: 'text/json',
                });
                const jsonURL = URL.createObjectURL(jsonData);
                link.href = jsonURL;
                link.download = `DataTracker Results ${new Date().toLocaleDateString()}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex flex-row gap-2"
            >
              <Code2Icon className="h-4 w-4" />
              Download
            </Button>
          </ToolTipWrapper>

          <BackButton
            Label="Back to Evaluations"
            Href={createHref({ type: 'Evaluations', group: Group!, individual: Individual! })}
          />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Spreadsheet
          data={data}
          columnLabels={columnLabels}
          onKeyDown={(ev) => {
            if (ev.key.toLocaleLowerCase() === 'v') ev.preventDefault();
          }}
        />
      </CardContent>
    </Card>
  );
}
