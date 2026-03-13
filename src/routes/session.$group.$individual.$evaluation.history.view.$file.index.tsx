import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';
import SessionViewerPage from '../components/editor-session-outcome/session-viewer-page';
import { GetResultsFromEvaluationFolder } from '@/lib/files';
import { GenerateSavedFileName } from '@/lib/writer';
import { getLocalCachedPrefs } from '@/lib/local_storage';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/history/view/$file/')({
  loader: async ({ params, context }) => {
    const { group, individual, evaluation, file } = params;
    const { routerHandle } = context;

    if (!group || !individual || !evaluation || !file || !routerHandle.handle) {
      throw redirect({
        href: createHref({ type: 'Dashboard' }),
      });
    }

    const FileString = CleanUpString(file);

    const { results } = await GetResultsFromEvaluationFolder(routerHandle.handle, group, individual, evaluation);

    if (!results) {
      throw redirect({
        href: createHref({ type: 'Dashboard' }),
      });
    }

    const modified_session = results.map((session) => {
      return {
        ...session,
        Filename: GenerateSavedFileName(session.SessionSettings),
      };
    });

    const relevant_session = modified_session.find((s) => s.Filename.includes(FileString));

    if (relevant_session) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plot_object: any[] = [];

      const keys = relevant_session.Keyset.FrequencyKeys.map((k) => k.KeyDescription);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prev: any = {
          second: Math.floor(k.TimeIntoSession),
        };
        prev[k.KeyDescription] = reference_object[k.KeyDescription];

        plot_object.push(prev);

        reference_object[k.KeyDescription] = reference_object[k.KeyDescription] + 1;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      const stored_prefs = getLocalCachedPrefs(group, individual, evaluation, `${group} ${individual} ${evaluation}`);

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

      return {
        Group: CleanUpString(group),
        Individual: CleanUpString(individual),
        Evaluation: CleanUpString(evaluation),
        PlotObject: plot_object,
        ExpandedSession: expandedSessionData,
        ShowKeys: show_keys_base,
      };
    } else {
      throw redirect({
        href: createHref({ type: 'Dashboard' }),
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, PlotObject, ExpandedSession, ShowKeys } = Route.useLoaderData();

  return (
    <SessionViewerPage
      Group={Group}
      Individual={Individual}
      Evaluation={Evaluation}
      PlotObject={PlotObject}
      ExpandedSession={ExpandedSession}
      ShowKeys={ShowKeys}
    />
  );
}
