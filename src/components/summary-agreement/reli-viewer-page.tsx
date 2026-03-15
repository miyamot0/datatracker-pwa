import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { FolderHandleContext } from '@/context/folder-context';
import { CleanUpString } from '@/lib/strings';
import { fetchSessionOutcomes } from '@/queries/outcomes/query-session-outcomes';
import { ErrorDisplay } from '@/components/suspense/error-display';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { useQuery } from '@tanstack/react-query';
import { getCorrespondingSessionPairs } from '@/lib/reli';
import { useContext } from 'react';
import ReliabilityBlank from './views/reli-blank';
import ReliabilityViewerContent from './views/reli-viewer-content';

export default function ReliabilityViewerPage({
  Group,
  Individual,
  Evaluation,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
}) {
  const { handle } = useContext(FolderHandleContext);

  const { data, isLoading, error } = useQuery({
    queryKey: ['/', Group, Individual, Evaluation, 'outcomes'],
    queryFn: () => fetchSessionOutcomes({ Handle: handle!, Group, Individual, Evaluation }),
  });

  if (isLoading) return <LoadingDisplay />;

  if (error || !data) return <ErrorDisplay Text={error?.message} />;

  // If there are no outcomes, show the blank state
  if (data.length == 0) {
    return (
      <ReliabilityBlank
        Group={CleanUpString(Group!)}
        Individual={CleanUpString(Individual!)}
        Evaluation={CleanUpString(Evaluation!)}
      />
    );
  }

  // Pull most recent keyset
  const KeySet = data.slice(-1)[0].Keyset;

  const resultsPrimary = data
    .sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session)
    .filter((result) => result.SessionSettings.Role === 'Primary');

  const resultsReli = data
    .sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session)
    .filter((result) => result.SessionSettings.Role === 'Reliability');

  const pairedSessionData = getCorrespondingSessionPairs(resultsPrimary, resultsReli);

  // If there are no paired sessions, show the blank state
  if (pairedSessionData.length < 1) {
    return (
      <ReliabilityBlank
        Group={CleanUpString(Group!)}
        Individual={CleanUpString(Individual!)}
        Evaluation={CleanUpString(Evaluation!)}
      />
    );
  }

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
      ]}
      label={`Reliability for ${CleanUpString(Evaluation)}`}
      className="select-none"
    >
      <ReliabilityViewerContent Group={Group} Individual={Individual} Paired={pairedSessionData} Keyset={KeySet} />
    </PageWrapper>
  );
}
