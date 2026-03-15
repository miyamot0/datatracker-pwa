import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildSessionHistoryBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { useContext } from 'react';
import { FolderHandleContext } from '@/context/folder-context';
import { ErrorDisplay } from '../suspense/error-display';
import { LoadingDisplay } from '../suspense/loading-display';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import { useQuery } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import SessionManagerContent from './session-manager-content';

export default function SessionManagerPage({
  Group,
  Individual,
  Evaluation,
  FileString,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  FileString: string;
}) {
  const { handle } = useContext(FolderHandleContext);
  const { data, isLoading, error } = useQuery(sessionOutcomesQueryOptions(handle!, Group, Individual, Evaluation));

  if (isLoading) return <LoadingDisplay />;

  if (error || data == undefined) return <ErrorDisplay Text={'An error occurred while fetching session outcomes.'} />;

  const relevant_session = data.find((s) => s.Filename.startsWith(FileString));

  if (relevant_session) {
    const saved_keys = [
      ...relevant_session.FrequencyKeyPresses,
      ...relevant_session.DurationKeyPresses,
      ...relevant_session.SystemKeyPresses,
    ].sort((a, b) => a.TimeIntoSession - b.TimeIntoSession);

    return (
      <PageWrapper
        breadcrumbs={[
          BuildGroupBreadcrumb(),
          BuildIndividualsBreadcrumb(Group),
          BuildEvaluationsBreadcrumb(Group, Individual),
          BuildSessionHistoryBreadcrumb(Group, Individual, Evaluation),
        ]}
        label={'Session Manager'}
        className="select-none"
      >
        <SessionManagerContent
          Group={Group}
          Individual={Individual}
          Evaluation={Evaluation}
          Session={relevant_session}
          SavedKeys={saved_keys}
        />
      </PageWrapper>
    );
  } else {
    throw redirect({
      to: '/dashboard',
    });
  }
}
