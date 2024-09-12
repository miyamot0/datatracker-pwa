import PageWrapper from "@/components/layout/page-wrapper";
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from "@/components/ui/breadcrumb-entries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CleanUpString } from "@/lib/strings";
import { KeySet } from "@/types/keyset";
import { ScoredKey } from "@/types/reli";
import React from "react";
import Spreadsheet from "react-spreadsheet";

type Props = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Keyset: KeySet;
  Sessions: number[];
  ScoredFrequency: ScoredKey[][];
  ScoredDuration: ScoredKey[][];
};

export default function ReliabilityViewerPage({
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

  f_headings.unshift("Session #");

  const f_rows = Sessions.map((session) => {
    const temp_array = [{ value: session.toString(), readOnly: true }];

    Keyset.FrequencyKeys.forEach((key) => {
      const session_to_show = ScoredFrequency.flat().find(
        (s) => s.Session === session && s.KeyName === key.KeyName
      );

      temp_array.push({
        value: session_to_show?.EIA.toFixed(2) ?? "",
        readOnly: true,
      }),
        temp_array.push({
          value: session_to_show?.PIA.toFixed(2) ?? "",
          readOnly: true,
        }),
        temp_array.push({
          value: session_to_show?.TIA.toFixed(2) ?? "",
          readOnly: true,
        }),
        temp_array.push({
          value: session_to_show?.OIA.toFixed(2) ?? "",
          readOnly: true,
        }),
        temp_array.push({
          value: session_to_show?.NIA.toFixed(2) ?? "",
          readOnly: true,
        }),
        temp_array.push({
          value: session_to_show?.PMA.toFixed(2) ?? "",
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

  d_headings.unshift("Session #");

  const d_rows = Sessions.map((session) => {
    const temp_array = [{ value: session.toString(), readOnly: true }];

    Keyset.DurationKeys.forEach((key) => {
      const session_to_show = ScoredDuration.flat().find(
        (s) => s.Session === session && s.KeyName === key.KeyName
      );

      temp_array.push({
        value: session_to_show?.EIA.toFixed(2) ?? "",
        readOnly: true,
      }),
        temp_array.push({
          value: session_to_show?.PIA.toFixed(2) ?? "",
          readOnly: true,
        }),
        temp_array.push({
          value: session_to_show?.TIA.toFixed(2) ?? "",
          readOnly: true,
        }),
        temp_array.push({
          value: session_to_show?.OIA.toFixed(2) ?? "",
          readOnly: true,
        }),
        temp_array.push({
          value: session_to_show?.NIA.toFixed(2) ?? "",
          readOnly: true,
        }),
        temp_array.push({
          value: session_to_show?.PMA.toFixed(2) ?? "",
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
            <CardDescription>
              Estimates of various indices are presented below in 10s bins
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Spreadsheet
              data={f_rows}
              columnLabels={f_headings}
              onKeyDown={(ev) => {
                if (ev.key.toLocaleLowerCase() === "v") ev.preventDefault();
              }}
            />
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Reliability Estimates: Duration</CardTitle>
            <CardDescription>
              Estimates of various indices are presented below in 10s bins
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Spreadsheet
              data={d_rows}
              columnLabels={d_headings}
              onKeyDown={(ev) => {
                if (ev.key.toLocaleLowerCase() === "v") ev.preventDefault();
              }}
            />
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
