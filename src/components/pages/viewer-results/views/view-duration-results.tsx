import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SavedSessionResult } from "@/lib/dtos";
import { KeySet } from "@/types/keyset";
import { Code2Icon, TableIcon } from "lucide-react";
import React from "react";
import { exportHumanReadableToCSV } from "@/lib/download";
import {
  EntryHolder,
  HumanReadableResults,
  HumanReadableResultsRow,
} from "@/types/export";
import ToolTipWrapper from "@/components/ui/tooltip-wrapper";
import Spreadsheet, { CellBase, Matrix } from "react-spreadsheet";

type Props = {
  Keyset: KeySet;
  Results: SavedSessionResult[];
};

export default function ViewDurationResults({ Keyset, Results }: Props) {
  const hr_results: HumanReadableResults = {
    type: "Duration",
    keys: Keyset.DurationKeys.map((key) => ({
      Key: key.KeyName,
      Value: key.KeyDescription,
    })),

    results: [],
  };

  Results.map((result) => {
    const session_minutes = result.TimerMain / 60;
    const temp_array: string[] = [];

    const temp_result = {
      Session: result.SessionSettings.Session,
      Condition: result.SessionSettings.Condition,
      DataCollector: result.SessionSettings.Initials,
      Therapist: result.SessionSettings.Therapist,
      values: [] as EntryHolder[],
      duration: result.TimerMain / 60,
      Timer1: result.TimerOne / 60,
      Timer2: result.TimerTwo / 60,
      Timer3: result.TimerThree / 60,
    } satisfies HumanReadableResultsRow;

    Keyset.DurationKeys.map((key) => {
      const key_obj = result.DurationKeyPresses.filter(
        (k) => k.KeyDescription === key.KeyDescription
      ).sort(
        (a, b) =>
          new Date(a.TimePressed).valueOf() - new Date(b.TimePressed).valueOf()
      );

      let total_duration = 0;
      let is_odd = key_obj.length % 2 === 1;

      if (is_odd) {
        for (let i = 0; i < key_obj.length - 1; i += 2) {
          const time_1 = new Date(key_obj[i].TimePressed);
          const time_2 = new Date(key_obj[i + 1].TimePressed);

          const duration = (time_2.getTime() - time_1.getTime()) / 1000;

          total_duration += duration;
        }

        const dur_til_end =
          new Date(result.SessionEnd).getTime() -
          new Date(key_obj.slice(-1)[0].TimePressed).getTime();

        total_duration += dur_til_end / 1000;
      } else {
        for (let i = 0; i < key_obj.length; i += 2) {
          const time_1 = new Date(key_obj[i].TimePressed);
          const time_2 = new Date(key_obj[i + 1].TimePressed);

          const duration = (time_2.getTime() - time_1.getTime()) / 1000;

          total_duration += duration;
        }
      }

      temp_result.values.push({
        Key: key.KeyDescription,
        Value: total_duration.toPrecision(2),
      });

      temp_result.values.push({
        Key: key.KeyDescription,
        Value: (
          (total_duration / result.SessionSettings.DurationS) *
          100
        ).toPrecision(2),
      });

      temp_array.push(key_obj.length.toString());
      temp_array.push((key_obj.length / session_minutes).toPrecision(2));
    });

    temp_array.push(session_minutes.toPrecision(2));

    hr_results.results.push(temp_result);
  });

  const csv_string = exportHumanReadableToCSV(hr_results);

  const columnLabels = [
    "Session #",
    "Condition",
    "Data Collector",
    "Therapist",
  ];
  hr_results.keys.forEach((entry) => {
    columnLabels.push(entry.Value + " (Seconds)");
    columnLabels.push(entry.Value + " (Percent)");
  });
  columnLabels.push("Main Timer (Min)");
  columnLabels.push("Timer #1 (Min)");
  columnLabels.push("Timer #2 (Min)");
  columnLabels.push("Timer #3 (Min)");

  const data = hr_results.results.map((datum) => {
    const values = datum.values.map((datum2) => {
      return {
        value: datum2.Value.toString(),
        readOnly: true,
      };
    });

    return [
      { value: datum.Session.toString(), readOnly: true },
      { value: datum.Condition.toString(), readOnly: true },
      { value: datum.DataCollector.toString(), readOnly: true },
      { value: datum.Therapist.toString(), readOnly: true },
      ...values,
      { value: datum.duration.toFixed(2), readOnly: true },
      { value: datum.Timer1.toFixed(2), readOnly: true },
      { value: datum.Timer2.toFixed(2), readOnly: true },
      { value: datum.Timer3.toFixed(2), readOnly: true },
    ];
  }) as Matrix<CellBase<any>>;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Summary of Session Duration Data</CardTitle>
          <CardDescription>
            Key Presses are summarized in the table below
          </CardDescription>
        </div>
        <div className="flex flex-row gap-2">
          <ToolTipWrapper Label="Download data as CSV">
            <Button
              size={"sm"}
              variant={"outline"}
              onClick={() => {
                const link = document.createElement("a");
                const csvData = new Blob([csv_string], {
                  type: "text/csv",
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
              size={"sm"}
              variant={"outline"}
              onClick={() => {
                const link = document.createElement("a");
                const jsonData = new Blob([JSON.stringify(hr_results)], {
                  type: "text/json",
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
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Spreadsheet
          data={data}
          columnLabels={columnLabels}
          onKeyDown={(ev) => {
            if (ev.key.toLocaleLowerCase() === "v") ev.preventDefault();
          }}
        />
      </CardContent>
    </Card>
  );
}
