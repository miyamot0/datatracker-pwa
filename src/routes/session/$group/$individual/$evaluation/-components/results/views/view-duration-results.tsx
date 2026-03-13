import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SavedSessionResult } from '@/lib/dtos';
import { Code2Icon, KeyboardIcon, TableIcon } from 'lucide-react';
import { exportHumanReadableToCSV } from '@/lib/download';
import { EntryHolder, HumanReadableResults, HumanReadableResultsRow } from '@/types/export';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import Spreadsheet, { CellBase, Matrix } from 'react-spreadsheet';
import { walkSessionDurationKey } from '../helpers/schedule_parser';
import BackButton from '@/components/ui/back-button';
import createHref from '@/lib/links';
import {
  SessionTerminationOptionsType,
  SessionTerminationOptions,
} from '@/routes/session/$group/$individual/$evaluation/-components/session-designer/forms/schema/session-designer-schema';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { setLocalCachedPrefs } from '@/lib/local_storage';
import { EnhancedKeySetInstance } from '@/types/keyset';

type Props = {
  SessionTimer: SessionTerminationOptionsType;
  Results: SavedSessionResult[];
  UnfilteredKeyList: EnhancedKeySetInstance[];
  Group: string;
  Individual: string;
  Evaluation: string;
};

export default function ViewDurationResults({
  SessionTimer,
  Results,
  UnfilteredKeyList,
  Group,
  Individual,
  Evaluation,
}: Props) {
  const [filteredKeys, setFilteredKeys] = useState(UnfilteredKeyList);

  const filteredKeySelection = filteredKeys.filter((key) => key.Type === 'Key');
  const hr_results: HumanReadableResults = {
    keys: filteredKeySelection.map((key) => ({
      Key: key.KeyDescription,
      Value: key.KeyDescription,
      Visible: key.Visible,
    })),
    type: 'Duration',
    results: [],
  };

  // Note: Loop through each session recorded
  Results.map((result) => {
    const system_events = result.SystemKeyPresses.map((press) => new Date(press.TimePressed)).sort(
      (a, b) => a.getTime() - b.getTime(),
    );

    // Note: Bail if no system events found
    if (system_events.length === 0) throw new Error('No system events found');

    const session_minutes = result.TimerMain / 60;

    const temp_array: string[] = [];

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

    // Note: Loop through each key in the keyset to enforce common ordering
    filteredKeys
      .filter((k) => k.Visible)
      .map((key) => {
        const key_obj = result.DurationKeyPresses.filter((k) => k.KeyDescription === key.KeyDescription).sort(
          (a, b) => new Date(a.TimePressed).valueOf() - new Date(b.TimePressed).valueOf(),
        );

        const primary = walkSessionDurationKey(result, 'Primary', key);
        const secondary = walkSessionDurationKey(result, 'Secondary', key);
        const tertiary = walkSessionDurationKey(result, 'Tertiary', key);

        const score_by_schedule = [primary, secondary, tertiary];

        // Sum up total duration for this key
        const total_duration = score_by_schedule.reduce((partialSum, a) => partialSum + a.Value, 0);

        // Sum up total bouts for this key
        const bouts_by_schedule = score_by_schedule.reduce((partialSum, a) => partialSum + a.Bouts, 0);

        switch (SessionTimer) {
          case SessionTerminationOptions.TimerMain:
            // Total Seconds
            temp_result.values.push({
              Key: key.KeyDescription,
              Value: total_duration.toFixed(2),
            });

            // Percentage of Session
            temp_result.values.push({
              Key: key.KeyDescription,
              Value: ((total_duration / (session_minutes * 60)) * 100).toFixed(2),
            });

            // Total Bouts
            temp_result.values.push({
              Key: key.KeyDescription,
              Value: bouts_by_schedule.toString(),
            });

            // Average Bout Length
            temp_result.values.push({
              Key: key.KeyDescription,
              Value: (total_duration / bouts_by_schedule).toFixed(2),
            });

            break;
          case SessionTerminationOptions.Timer1:
            // Timer #1 Seconds
            temp_result.values.push({
              Key: key.KeyDescription,
              Value: primary.Value.toFixed(2),
            });

            // Timer #1 Percentage
            temp_result.values.push({
              Key: key.KeyDescription,
              Value: ((primary.Value / result.TimerOne) * 100).toFixed(2),
            });

            // Timer #1 Bouts
            temp_result.values.push({
              Key: key.KeyDescription,
              Value: primary.Bouts.toString(),
            });

            // Timer #1 Average Bout Length
            temp_result.values.push({
              Key: key.KeyDescription,
              Value: (primary.Value / primary.Bouts).toFixed(2),
            });

            break;
          case SessionTerminationOptions.Timer2:
            // Timer #2 Seconds
            temp_result.values.push({
              Key: key.KeyDescription,
              Value: secondary.Value.toFixed(2),
            });

            // Timer #2 Percentage
            temp_result.values.push({
              Key: key.KeyDescription,
              Value: ((secondary.Value / result.TimerTwo) * 100).toFixed(2),
            });

            // Timer #2 Bouts
            temp_result.values.push({
              Key: key.KeyDescription,
              Value: secondary.Bouts.toString(),
            });

            // Timer #2 Average Bout Length
            temp_result.values.push({
              Key: key.KeyDescription,
              Value: (secondary.Value / secondary.Bouts).toFixed(2),
            });
            break;
          case SessionTerminationOptions.Timer3:
            // Timer #3 Seconds
            temp_result.values.push({
              Key: key.KeyDescription,
              Value: tertiary.Value.toFixed(2),
            });

            // Timer #3 Percentage
            temp_result.values.push({
              Key: key.KeyDescription,
              Value: ((tertiary.Value / result.TimerThree) * 100).toFixed(2),
            });

            // Timer #3 Bouts
            temp_result.values.push({
              Key: key.KeyDescription,
              Value: tertiary.Bouts.toString(),
            });

            // Timer #3 Average Bout Length
            temp_result.values.push({
              Key: key.KeyDescription,
              Value: (tertiary.Value / tertiary.Bouts).toFixed(2),
            });

            break;
          default:
            break;
        }

        temp_array.push(key_obj.length.toString());
        temp_array.push((key_obj.length / session_minutes).toFixed(2));
      });

    temp_array.push(session_minutes.toFixed(2));

    hr_results.results.push(temp_result);
  });

  const csv_string = exportHumanReadableToCSV(hr_results);

  const columnLabels = ['Session #', 'Date', 'Time', 'Condition', 'Data Collector', 'Therapist'];

  switch (SessionTimer) {
    case SessionTerminationOptions.TimerMain:
      columnLabels.push('Duration Session (min)');
      break;
    case SessionTerminationOptions.Timer1:
      columnLabels.push('Duration Timer #1 (min)');
      break;
    case SessionTerminationOptions.Timer2:
      columnLabels.push('Duration Timer #2 (min)');
      break;
    case SessionTerminationOptions.Timer3:
      columnLabels.push('Duration Timer #3 (min)');
      break;
    default:
      break;
  }

  hr_results.keys.forEach((entry) => {
    if (entry.Visible === false) return;

    switch (SessionTimer) {
      case SessionTerminationOptions.TimerMain:
        columnLabels.push(entry.Value + ' (Total Seconds)');
        columnLabels.push(entry.Value + ' (Total Percentage)');
        columnLabels.push(entry.Value + ' (Total Bouts)');
        columnLabels.push(entry.Value + ' (Total Average Bout Length)');
        break;
      case SessionTerminationOptions.Timer1:
        columnLabels.push(entry.Value + ' (Timer #1 Seconds)');
        columnLabels.push(entry.Value + ' (Timer #1 Percentage)');
        columnLabels.push(entry.Value + ' (Timer #1 Bouts)');
        columnLabels.push(entry.Value + ' (Timer #1 Average Bout Length)');
        break;
      case SessionTerminationOptions.Timer2:
        columnLabels.push(entry.Value + ' (Timer #2 Seconds)');
        columnLabels.push(entry.Value + ' (Timer #2 Percentage)');
        columnLabels.push(entry.Value + ' (Timer #2 Bouts)');
        columnLabels.push(entry.Value + ' (Timer #2 Average Bout Length)');
        break;
      case SessionTerminationOptions.Timer3:
        columnLabels.push(entry.Value + ' (Timer #3 Seconds)');
        columnLabels.push(entry.Value + ' (Timer #3 Percentage)');
        columnLabels.push(entry.Value + ' (Timer #3 Bouts)');
        columnLabels.push(entry.Value + ' (Timer #3 Average Bout Length)');
        break;
      default:
        break;
    }
  });

  const data = hr_results.results.map((datum) => {
    const values = datum.values.map((datum2) => {
      return {
        value: datum2.Value.toString(),
        readOnly: true,
      };
    });

    const builder = [
      { value: datum.Session.toString(), readOnly: true },
      { value: datum.Date.toLocaleDateString(), readOnly: true },
      { value: datum.Date.toLocaleTimeString(), readOnly: true },
      { value: datum.Condition.toString(), readOnly: true },
      { value: datum.DataCollector.toString(), readOnly: true },
      { value: datum.Therapist.toString(), readOnly: true },
    ];

    switch (SessionTimer) {
      case SessionTerminationOptions.TimerMain:
        builder.push({ value: datum.duration.toFixed(2), readOnly: true });
        break;
      case SessionTerminationOptions.Timer1:
        builder.push({ value: datum.Timer1.toFixed(2), readOnly: true });
        break;
      case SessionTerminationOptions.Timer2:
        builder.push({ value: datum.Timer2.toFixed(2), readOnly: true });
        break;
      case SessionTerminationOptions.Timer3:
        builder.push({ value: datum.Timer3.toFixed(2), readOnly: true });
        break;
      default:
        break;
    }

    return [...builder, ...values];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as Matrix<CellBase<any>>;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Summary of Session Duration Data</CardTitle>
          <CardDescription>Key Presses are summarized in the table below</CardDescription>
        </div>
        <div className="flex flex-row gap-2">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size={'sm'} className="w-fit">
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

                    setLocalCachedPrefs(Group!, Individual!, Evaluation!, 'Duration', {
                      KeyDescription: hidden_keys,
                      CTBElements: [],
                      Schedule: SessionTimer,
                    });
                  }}
                >
                  {key.KeyDescription}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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
