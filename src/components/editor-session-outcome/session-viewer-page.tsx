/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { ErrorDisplay } from '../suspense/error-display';
import { LoadingDisplay } from '../suspense/loading-display';
import { useQuery } from '@tanstack/react-query';
import { GenerateSavedFileName } from '@/lib/writer';
import { redirect } from '@tanstack/react-router';
import SessionViewerContent from './views/session-viewer-content';
import { pullMostRecentKeySet } from '@/lib/keyset';
import { prepareDataOrganization } from '@/lib/summary';
import { combineAndSortKeyPresses } from '@/lib/schedule-parser';

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

    const plot_object: any[] = [];

    const keys = relevantSession.Keyset.FrequencyKeys.map((k) => k.KeyDescription);

    const start_object: any = {
      second: 0,
    };

    // Start point
    keys.forEach((k) => {
      start_object[k] = 0;
    });
    plot_object.push(start_object);

    // For holding the reference object
    const reference_object = { ...start_object };

    relevantSession.FrequencyKeyPresses.forEach((k) => {
      const prev: any = {
        second: Math.floor(k.TimeIntoSession),
      };
      prev[k.KeyDescription] = reference_object[k.KeyDescription];

      plot_object.push(prev);

      reference_object[k.KeyDescription] = reference_object[k.KeyDescription] + 1;

      const curr: any = {
        second: Math.floor(k.TimeIntoSession),
      };
      curr[k.KeyDescription] = reference_object[k.KeyDescription];

      plot_object.push(curr);
    });

    const final_object = {
      ...reference_object,
      second: Math.floor(relevantSession.TimerMain),
    };

    plot_object.push(final_object);

    const max_ys = [] as number[];

    plot_object.forEach((point) => {
      const keys = Object.keys(point).filter((k) => k !== 'second');

      keys.forEach((key) => {
        max_ys.push(point[key]);
      });
    });

    const max_y = Math.max(...max_ys);

    const y_ticks = Array(max_y + 1)
      .fill(0)
      .map((_, index) => index);

    const expandedSessionData = {
      ...relevantSession,
      Filename: GenerateSavedFileName(relevantSession.SessionSettings),
      MaxY: max_y + 1,
      YTicks: y_ticks,
      PlottedKeys: combineAndSortKeyPresses(relevantSession),
    };

    const show_keys_base = UnfilteredKeysFrequency.map((key) => ({
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
          ShowKeys={show_keys_base}
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
