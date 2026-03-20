import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SavedSessionResult } from '@/lib/dtos';
import { Code2Icon, KeyboardIcon, TableIcon } from 'lucide-react';
import { exportHumanReadableToCSV } from '@/lib/download';
import { EntryHolder, HumanReadableResults, HumanReadableResultsRow } from '@/types/export';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import Spreadsheet, { CellBase, Matrix } from 'react-spreadsheet';
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
import { KeySet } from '@/types/keyset';
import { walkSessionFrequencyKey } from '@/lib/schedule-parser';
import BackButton from '@/components/ui/back-button';
import { SessionTerminationOptions, SessionTerminationOptionsType } from '@/types/terminations';
import { ToggleDisplayKey } from '@/types/visuals';
import { evaluateLogic } from '@/lib/logic';

type Props = {
  SessionTimer: SessionTerminationOptionsType;
  Results: SavedSessionResult[];
  LatestKeyset: KeySet;
  ShowKeysFreq: ToggleDisplayKey[];
  Group: string;
  Individual: string;
  Evaluation: string;
};

export default function ViewFrequencyResults({
  SessionTimer,
  Results,
  LatestKeyset,
  ShowKeysFreq,
  Group,
  Individual,
  Evaluation,
}: Props) {
  const [filteredKeys, setFilteredKeys] = useState(ShowKeysFreq);

  const observedKeys = filteredKeys.filter((key) => key.KeyType === 'Observed');
  const derivedKeys = filteredKeys.filter((key) => key.KeyType === 'Derived');

  const hr_results: HumanReadableResults = {
    type: 'Frequency',
    keys: observedKeys.map((key) => ({
      Key: key.KeyName,
      KeyCode: key.KeyCode,
      Value: key.KeyDescription,
      Visible: key.Visible,
    })),

    results: [],
  };

  // Note: each are mapped at the session-level
  Results.map((result) => {
    const system_events = result.SystemKeyPresses.map((press) => new Date(press.TimePressed)).sort(
      (a, b) => a.getTime() - b.getTime(),
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

    // Note: per session

    const sumObservedKeys = LatestKeyset.FrequencyKeys.map((key) => {
      const primary = walkSessionFrequencyKey(result, 'Primary', key);
      const secondary = walkSessionFrequencyKey(result, 'Secondary', key);
      const tertiary = walkSessionFrequencyKey(result, 'Tertiary', key);
      const score_by_schedule = [primary, secondary, tertiary];

      const total_frequency = score_by_schedule.reduce((partialSum, a) => partialSum + a.Value, 0);

      switch (SessionTimer) {
        case SessionTerminationOptions.TimerMain: {
          const total_count = {
            Key: key.KeyDescription,
            KeyCode: key.KeyCode,
            Value: total_frequency,
            Minutes: result.TimerMain / 60,
          };

          return total_count;
        }
        case SessionTerminationOptions.Timer1: {
          const total_count = {
            Key: key.KeyDescription,
            KeyCode: key.KeyCode,
            Value: primary.Value,
            Minutes: result.TimerOne / 60,
          };

          return total_count;
        }
        case SessionTerminationOptions.Timer2: {
          const total_count = {
            Key: key.KeyDescription,
            KeyCode: key.KeyCode,
            Value: secondary.Value,
            Minutes: result.TimerTwo / 60,
          };

          return total_count;
        }
        case SessionTerminationOptions.Timer3: {
          const total_count = {
            Key: key.KeyDescription,
            KeyCode: key.KeyCode,
            Value: tertiary.Value,
            Minutes: result.TimerThree / 60,
          };
          return total_count;
        }
      }
    });

    observedKeys.forEach((key) => {
      if (key.Visible === false) return;

      const pullFromCurrentData = sumObservedKeys.find((datum) => datum.KeyCode === key.KeyCode);

      if (!pullFromCurrentData) {
        throw new Error(`Key with KeyCode ${key.KeyCode} not found in current session data`);
      }

      // Total Count
      temp_result.values.push({ ...pullFromCurrentData, Value: pullFromCurrentData.Value.toString() });

      // Total Rate
      temp_result.values.push({
        ...pullFromCurrentData,
        Value: (pullFromCurrentData.Value / pullFromCurrentData.Minutes).toFixed(2),
      });
    });

    derivedKeys.forEach((key) => {
      if (key.Visible === false) return;

      const logicalState = LatestKeyset.DerivedKeys.find((derived) => derived.name === key.KeyName);

      if (!logicalState) {
        throw new Error(`Logical state not found for key ${key.KeyName}`);
      }

      // Pull in relevant fields with updated values based on the current session result
      const updatedKeys = logicalState.fields.map((field) => {
        const foundKey = sumObservedKeys.find((score) => score?.KeyCode === field.KeyCode);
        return {
          ...field,
          Value: foundKey ? foundKey.Value : NaN,
          Minutes: foundKey ? foundKey.Minutes : NaN,
        };
      });

      if (updatedKeys.length < 1) return;

      // Evaluate the logic with the updated field values
      const newLogicalState = {
        ...logicalState,
        fields: updatedKeys,
      };

      const calculatedValue = evaluateLogic(newLogicalState);

      // Total Count
      temp_result.values.push({
        Key: key.KeyDescription,

        KeyCode: key.KeyCode,
        Value: calculatedValue.toString(),
      });

      const min = updatedKeys[0].Minutes;

      // Total Rate
      temp_result.values.push({
        Key: key.KeyDescription,
        KeyCode: key.KeyCode,
        Value: (calculatedValue / min).toFixed(2),
      });
    });

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
        columnLabels.push(entry.Value + ' (Session Count)');
        columnLabels.push(entry.Value + ' (Session Rate)');
        break;
      case SessionTerminationOptions.Timer1:
        columnLabels.push(entry.Value + ' (Timer #1 Count)');
        columnLabels.push(entry.Value + ' (Timer #1 Rate)');
        break;
      case SessionTerminationOptions.Timer2:
        columnLabels.push(entry.Value + ' (Timer #2 Count)');
        columnLabels.push(entry.Value + ' (Timer #2 Rate)');
        break;
      case SessionTerminationOptions.Timer3:
        columnLabels.push(entry.Value + ' (Timer #3 Count)');
        columnLabels.push(entry.Value + ' (Timer #3 Rate)');
        break;
      default:
        break;
    }
  });

  derivedKeys.forEach((key) => {
    if (key.Visible === false) return;

    columnLabels.push(key.KeyDescription + ' (Derived Count)');
    columnLabels.push(key.KeyDescription + ' (Derived Rate)');
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
          <CardTitle>Summary of Session Frequency Data</CardTitle>
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

                    setLocalCachedPrefs(Group, Individual, Evaluation, 'Rate', {
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

          <BackButton />
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
