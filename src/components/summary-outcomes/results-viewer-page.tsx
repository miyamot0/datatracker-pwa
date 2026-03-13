import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { CleanUpString } from '@/lib/strings';
import { FolderHandleContext } from '@/context/folder-context';

import { useQuery } from '@tanstack/react-query';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import ResultsViewerContent from './views/results-viewer-content';
import { PullRelevantSetup } from './helpers/results_setup';
import { ErrorDisplay } from '@/components/suspense/error-display';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { useContext } from 'react';

export default function ResultsViewerPage({
  Group,
  Individual,
  Evaluation,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
}) {
  const { handle } = useContext(FolderHandleContext);
  const { data, isLoading, error } = useQuery(sessionOutcomesQueryOptions(handle!, Group, Individual, Evaluation));

  if (isLoading) return <LoadingDisplay />;

  if (error || !data) return <ErrorDisplay Text={error?.message} />;

  const prep = PullRelevantSetup(Group, Individual, Evaluation, data[0].Keyset);

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(CleanUpString(Group)),
        BuildEvaluationsBreadcrumb(CleanUpString(Group), CleanUpString(Individual)),
      ]}
      label={`View ${CleanUpString(CleanUpString(Evaluation))} Data`}
      className="select-none"
    >
      <ResultsViewerContent
        UnfilteredKeysFrequency={prep.UnfilteredKeysFrequency}
        UnfilteredKeysDuration={prep.UnfilteredKeysDuration}
        TimerMapping={prep.TimerMapping}
        ExcludeFromCTB={prep.ExcludeFromCTB}
        Results={data}
        Keyset={data[0].Keyset}
        Group={Group}
        Individual={Individual}
        Evaluation={Evaluation}
      />
    </PageWrapper>
  );
}
