import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SavedSessionResult } from '@/lib/dtos';
import { Code2Icon, KeyboardIcon, TableIcon } from 'lucide-react';
import { exportHumanReadableToCSV } from '@/lib/download';
import { HumanReadableResults, HumanReadableResultsRow } from '@/types/export';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import Spreadsheet from 'react-spreadsheet';
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
import BackButton from '@/components/ui/back-button';
import { SessionTerminationOptionsType } from '@/types/terminations';
import { ToggleDisplayKey } from '@/types/visuals';
import { buildDurationColumnLabels, buildSpreadsheetData, processDurationKeys } from '@/lib/summary';

type Props = {
  SessionTimer: SessionTerminationOptionsType;
  Results: SavedSessionResult[];
  LatestKeyset: KeySet; // Note: Not needed until derived keys come in
  ShowKeysDuration: ToggleDisplayKey[];
  Group: string;
  Individual: string;
  Evaluation: string;
};

export default function ViewDurationResults({
  SessionTimer,
  Results,
  ShowKeysDuration,
  Group,
  Individual,
  Evaluation,
}: Props) {
  const [filteredKeys, setFilteredKeys] = useState(ShowKeysDuration);

  // Build human-readable results
  const hr_results: HumanReadableResults = {
    type: 'Duration',
    keys: filteredKeys
      .filter((key) => key.Visible === true)
      .map((key) => ({
        Key: key.KeyDescription,
        KeyCode: key.KeyCode,
        Value: key.KeyDescription,
        Visible: key.Visible,
      })),
    results: Results.map((result) => {
      const systemEvents = result.SystemKeyPresses.map((press) => new Date(press.TimePressed)).sort(
        (a, b) => a.getTime() - b.getTime(),
      );

      if (systemEvents.length === 0) {
        throw new Error('No system events found');
      }

      const sessionRow: HumanReadableResultsRow = {
        Session: result.SessionSettings.Session,
        Date: systemEvents[0],
        Condition: result.SessionSettings.Condition,
        DataCollector: result.SessionSettings.Initials,
        Therapist: result.SessionSettings.Therapist,
        duration: result.TimerMain / 60,
        Timer1: result.TimerOne / 60,
        Timer2: result.TimerTwo / 60,
        Timer3: result.TimerThree / 60,
        values: [],
      };

      // Process duration keys
      sessionRow.values = processDurationKeys(result, SessionTimer, filteredKeys);
      return sessionRow;
    }),
  };

  const csv_string = exportHumanReadableToCSV(hr_results);
  const columnLabels = buildDurationColumnLabels(SessionTimer, filteredKeys);
  const data = buildSpreadsheetData(hr_results.results, SessionTimer);

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

                    setLocalCachedPrefs(Group, Individual, Evaluation, 'Duration', {
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
