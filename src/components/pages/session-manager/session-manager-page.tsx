/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { redirect, useLoaderData } from 'react-router-dom';
import { ExpandedSavedSessionResult } from '../viewer-session/session-viewer-page';
import { FolderHandleContextType } from '@/context/folder-context';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { GetResultsFromEvaluationFolder } from '@/lib/files';
import { GenerateSavedFileName } from '@/lib/writer';
import { getLocalCachedPrefs } from '@/lib/local_storage';
import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildSessionHistoryBreadcrumb,
} from '@/components/ui/breadcrumb-entries';

type LoaderResult = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Handle: FileSystemHandle;
  PlotObject: any[];
  ExpandedSession: ExpandedSavedSessionResult;
  ShowKeys: {
    KeyDescription: string;
    Visible: boolean;
  }[];
  Context: FolderHandleContextType;
};

// eslint-disable-next-line react-refresh/only-export-components
export const sessionManagerLoader = (ctx: FolderHandleContextType) => {
  const { handle } = ctx;

  return async ({ params }: any) => {
    const { Group, Individual, Evaluation, Index } = params;

    if (!Group || !Individual || !Evaluation || !Index || !handle) {
      const response = redirect(createHref({ type: 'Dashboard' }));
      throw response;
    }

    const FileString = CleanUpString(Index);

    const { results } = await GetResultsFromEvaluationFolder(handle, Group, Individual, Evaluation);

    if (!results) {
      const response = redirect(createHref({ type: 'Dashboard' }));
      throw response;
    }

    const modified_session = results.map((session) => {
      return {
        ...session,
        Filename: GenerateSavedFileName(session.SessionSettings),
      };
    });

    const relevant_session = modified_session.find((s) => s.Filename.includes(FileString));

    if (relevant_session) {
      const plot_object: any[] = [];

      const keys = relevant_session.Keyset.FrequencyKeys.map((k) => k.KeyDescription);

      let start_object: any = {
        second: 0,
      };

      // Start point
      keys.forEach((k) => {
        start_object[k] = 0;
      });
      plot_object.push(start_object);

      // For holding the reference object
      let reference_object = { ...start_object };

      relevant_session.FrequencyKeyPresses.forEach((k) => {
        let prev: any = {
          second: Math.floor(k.TimeIntoSession),
        };
        prev[k.KeyDescription] = reference_object[k.KeyDescription];

        plot_object.push(prev);

        reference_object[k.KeyDescription] = reference_object[k.KeyDescription] + 1;

        let curr: any = {
          second: Math.floor(k.TimeIntoSession),
        };
        curr[k.KeyDescription] = reference_object[k.KeyDescription];

        plot_object.push(curr);
      });

      let final_object = {
        ...reference_object,
        second: Math.floor(relevant_session.TimerMain),
      };

      plot_object.push(final_object);

      let max_ys = [] as number[];

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

      let show_keys_base = relevant_session.Keyset.FrequencyKeys.map((key) => {
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

      return {
        Group: CleanUpString(Group),
        Individual: CleanUpString(Individual),
        Evaluation: CleanUpString(Evaluation),
        Handle: handle,
        PlotObject: plot_object,
        ExpandedSession: expandedSessionData,
        ShowKeys: show_keys_base,
        Context: ctx,
      } satisfies LoaderResult;
    }

    const response = redirect(createHref({ type: 'Dashboard' }));
    throw response;
  };
};

export default function SessionManagerPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Evaluation } = loaderResult;

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
      <div>WIP</div>
    </PageWrapper>
  );
}
