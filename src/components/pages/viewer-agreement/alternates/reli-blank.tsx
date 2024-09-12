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
import React from "react";

type Props = {
  Group: string;
  Individual: string;
  Evaluation: string;
};

export default function ReliabilityBlank({
  Group,
  Individual,
  Evaluation,
}: Props) {
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
            <CardTitle>Reliability Viewer</CardTitle>
            <CardDescription>Error in Calculating Reliability</CardDescription>
          </CardHeader>
          <CardContent>
            No data files are currently available to inspect.
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
