import { GetResultsFromEvaluationFolder } from '@/lib/files';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { GenerateSavedFileName } from '@/lib/writer';
import { createFileRoute, redirect } from '@tanstack/react-router';
import SessionManagerPage from './-components/data-editor/session-manager-page';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/history/edit/$file')({
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
      const saved_keys = [
        ...relevant_session.FrequencyKeyPresses,
        ...relevant_session.DurationKeyPresses,
        ...relevant_session.SystemKeyPresses,
      ].sort((a, b) => a.TimeIntoSession - b.TimeIntoSession);

      return {
        Group: CleanUpString(group),
        Individual: CleanUpString(individual),
        Evaluation: CleanUpString(evaluation),
        // Note: Condition is pulled from FOLDER name
        Condition: CleanUpString(relevant_session.SessionSettings.Condition),
        Session: relevant_session,
        SavedKeys: saved_keys,
        Index: FileString,
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
  const { Group, Individual, Evaluation, Condition, Session, Index, SavedKeys } = Route.useLoaderData();
  return (
    <SessionManagerPage
      Group={Group}
      Individual={Individual}
      Evaluation={Evaluation}
      Condition={Condition}
      Session={Session}
      Index={Index}
      SavedKeys={SavedKeys}
    />
  );
}
