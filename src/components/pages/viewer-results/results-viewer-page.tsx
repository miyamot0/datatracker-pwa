"use client";

import PageWrapper from "@/components/layout/page-wrapper";
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
} from "@/components/ui/breadcrumb-entries";
import { DataCollectorRolesType } from "@/forms/schema/session-designer-schema";
import { SavedSessionResult } from "@/lib/dtos";
import { GetResultsFromEvaluationFolder } from "@/lib/files";
import { CleanUpString } from "@/lib/strings";
import { KeySet } from "@/types/keyset";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import React, { useEffect, useState } from "react";
import ViewFrequencyResults from "./views/view-frequency-results";
import ViewDurationResults from "./views/view-duration-results";

type Props = {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
  Evaluation: string;
};

export default function ResultsViewerPage({
  Handle,
  Group,
  Individual,
  Evaluation,
}: Props) {
  const [results, setResults] = useState<SavedSessionResult[]>([]);
  const [keySet, setKeySet] = useState<KeySet>();
  const [role, setRole] = useState<DataCollectorRolesType>("Primary");

  useEffect(() => {
    const load_data = async () => {
      const { keyset, results } = await GetResultsFromEvaluationFolder(
        Handle,
        Group,
        Individual,
        Evaluation
      );

      console.log(keyset);
      console.log(results);

      setKeySet(keyset);
      setResults(results);
    };

    load_data();
  }, [Handle, Group, Individual, Evaluation]);

  const results_filtered = results
    .sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session)
    .filter((result) => result.SessionSettings.Role === role);

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(CleanUpString(Group)),
        BuildEvaluationsBreadcrumb(
          CleanUpString(Group),
          CleanUpString(Individual)
        ),
      ]}
      label={`View ${CleanUpString(CleanUpString(Evaluation))} Data`}
    >
      <div className="flex flex-col w-full gap-4">
        <div className="flex flex-row items-center">
          <div className="flex flex-row items-center gap-2">
            <p>Filter by Data Collector:</p>
            <Select
              value={role}
              onValueChange={(value: DataCollectorRolesType) => {
                setRole(value);
              }}
            >
              <SelectTrigger className="w-fit">
                <SelectValue placeholder="Data Collector Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Primary">
                    Primary Data Collector
                  </SelectItem>
                  <SelectItem value="Reliability">
                    Reliability Data Collector
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {keySet && keySet.FrequencyKeys.length > 0 && (
          <ViewFrequencyResults Keyset={keySet} Results={results_filtered} />
        )}

        {keySet && keySet.DurationKeys.length > 0 && (
          <ViewDurationResults Keyset={keySet} Results={results_filtered} />
        )}
      </div>
    </PageWrapper>
  );
}
