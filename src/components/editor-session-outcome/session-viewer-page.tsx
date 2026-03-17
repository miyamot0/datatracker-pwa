/* eslint-disable @typescript-eslint/no-explicit-any */
import PageWrapper from '@/components/elements/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildSessionHistoryBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { useContext } from 'react';
import { getLocalCachedPrefs } from '@/lib/local_storage';
import { FolderHandleContext } from '@/context/folder-context';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import { ErrorDisplay } from '../suspense/error-display';
import { LoadingDisplay } from '../suspense/loading-display';
import { useQuery } from '@tanstack/react-query';
import { GenerateSavedFileName } from '@/lib/writer';
import { redirect } from '@tanstack/react-router';
import SessionViewerContent from './views/session-viewer-content';

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

  const relevant_session = data.find((s) => s.Filename.startsWith(FileString));

  if (relevant_session) {
    const plot_object: any[] = [];

    const keys = relevant_session.Keyset.FrequencyKeys.map((k) => k.KeyDescription);

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

    relevant_session.FrequencyKeyPresses.forEach((k) => {
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
      second: Math.floor(relevant_session.TimerMain),
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

    const saved_keys = [
      ...relevant_session.FrequencyKeyPresses,
      ...relevant_session.DurationKeyPresses,
      ...relevant_session.SystemKeyPresses,
    ].sort((a, b) => a.TimeIntoSession - b.TimeIntoSession);

    const expandedSessionData = {
      ...relevant_session,
      Filename: GenerateSavedFileName(relevant_session.SessionSettings),
      MaxY: max_y + 1,
      YTicks: y_ticks,
      PlottedKeys: saved_keys,
    };

    const stored_prefs = getLocalCachedPrefs(Group, Individual, Evaluation, `${Group} ${Individual} ${Evaluation}`);

    const show_keys_base = relevant_session.Keyset.FrequencyKeys.map((key) => {
      const should_disable = stored_prefs.KeyDescription.includes(key.KeyDescription);

      if (should_disable) {
        return {
          KeyDescription: key.KeyDescription,
          Visible: false,
        };
      }

      return {
        KeyDescription: key.KeyDescription,
        Visible: true,
      };
    });

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
