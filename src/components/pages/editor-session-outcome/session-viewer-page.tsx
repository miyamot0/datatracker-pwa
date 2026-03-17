import PageWrapper from '@/components/elements/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildSessionHistoryBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { useContext } from 'react';
import { FolderHandleContext } from '@/context/folder-context';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import { ErrorDisplay } from '../../suspense/error-display';
import { LoadingDisplay } from '../../suspense/loading-display';
import { useQuery } from '@tanstack/react-query';
import { GenerateSavedFileName } from '@/lib/writer';
import { redirect } from '@tanstack/react-router';
import SessionViewerContent from './views/session-viewer-content';
import { pullMostRecentKeySet } from '@/lib/keyset';
import { prepareDataOrganization, preparePlotDataCumulative } from '@/lib/summary';
import { combineAndSortKeyPresses } from '@/lib/schedule-parser';
import { generateTicks } from '@/lib/graphing';
import { ExpandedSavedSessionResult } from '@/lib/dtos';

export default function SessionViewerPage({
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

  const relevantSession = data.find((s) => s.Filename.startsWith(FileString));

  if (!relevantSession) {
    throw redirect({
      to: '/dashboard',
    });
  }

  if (relevantSession) {
    const keySet = pullMostRecentKeySet(data);
    const { UnfilteredKeysFrequency } = prepareDataOrganization(Group, Individual, Evaluation, keySet);
    const plot_object = preparePlotDataCumulative(relevantSession);

    const yValues = plot_object
      .map((point) => {
        const keys = Object.keys(point).filter((k) => k !== 'second');

        return keys.map((key) => point[key]);
      })
      .flat();

    const maxYValue = Math.max(...yValues) + 1;
    const yTicks = generateTicks(maxYValue, 0);
    const expandedSessionData = {
      ...relevantSession,
      Filename: GenerateSavedFileName(relevantSession.SessionSettings),
      MaxY: maxYValue,
      YTicks: yTicks,
      PlottedKeys: combineAndSortKeyPresses(relevantSession),
    } satisfies ExpandedSavedSessionResult;

    const showKeysBase = UnfilteredKeysFrequency.map((key) => ({
      KeyDescription: key.KeyDescription,
      Visible: key.Visible,
    }));

    return (
      <PageWrapper
        breadcrumbs={[
          BuildGroupBreadcrumb(),
          BuildIndividualsBreadcrumb(Group),
          BuildEvaluationsBreadcrumb(Group, Individual),
          BuildSessionHistoryBreadcrumb(Group, Individual, Evaluation),
        ]}
        label={'Session Viewer'}
        className="select-none"
      >
        <SessionViewerContent
          Group={Group}
          Individual={Individual}
          Evaluation={Evaluation}
          ShowKeys={showKeysBase}
          ExpandedSession={expandedSessionData}
          PlotObject={plot_object}
        />
      </PageWrapper>
    );
  } else {
    throw redirect({
      to: '/dashboard',
    });
  }
}
