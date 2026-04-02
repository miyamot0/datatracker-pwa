import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SavedSessionResult } from '@/lib/dtos/session-results';
import { Code2Icon, KeyboardIcon, TableIcon } from 'lucide-react';
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
import { processMultipleSessionDataWithKeys } from '@/lib/calculations';
import { convertLegacyTimerType } from '@/lib/calculations/calculation-helpers';
import { formatForSpreadsheet } from '@/lib/calculations/calculation-formatting';

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
  LatestKeyset,
  Group,
  Individual,
  Evaluation,
}: Props) {
  const [filteredKeys, setFilteredKeys] = useState(ShowKeysDuration);

  const durationResults = processMultipleSessionDataWithKeys(
    Results,
    LatestKeyset,
    convertLegacyTimerType(SessionTimer, LatestKeyset),
    'SPREADSHEET_ALL',
    {
      frequencyKeys: LatestKeyset.FrequencyKeys,
      durationKeys: LatestKeyset.DurationKeys.filter((key) => {
        const showKey = filteredKeys.find((k) => k.KeyName === key.KeyName);

        return showKey ? !showKey.Visible : false;
      }),
      derivedKeys: LatestKeyset.DerivedKeys,
    },
  );

  const matrix = formatForSpreadsheet(durationResults);
  const csvString = matrix.map((row) => row.join(',')).join('\r\n');

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
                const csvData = new Blob([csvString], {
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
                const jsonData = new Blob([JSON.stringify(durationResults)], {
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
          data={matrix.slice(1).map((row) => row.map((cell) => ({ value: cell.toString(), readOnly: true })))}
          columnLabels={matrix[0]}
          onKeyDown={(ev) => {
            if (ev.key.toLocaleLowerCase() === 'v') ev.preventDefault();
          }}
        />
      </CardContent>
    </Card>
  );
}
