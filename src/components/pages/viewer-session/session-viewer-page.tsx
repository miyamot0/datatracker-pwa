/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildSessionHistoryBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SavedSessionResult } from '@/lib/dtos';
import { GetResultsFromEvaluationFolder } from '@/lib/files';
import { GenerateSavedFileName } from '@/lib/writer';
import { useState } from 'react';
import SessionFigure from './views/session-figure';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { KeyboardIcon } from 'lucide-react';
import { KeyManageType } from '../session-recorder/types/session-recorder-types';
import SessionKeyList from './views/session-key-list';
import { FolderHandleContextType } from '@/context/folder-context';
import { redirect, useLoaderData } from 'react-router-dom';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { getLocalCachedPrefs, setLocalCachedPrefs } from '@/lib/local_storage';
import BackButton from '@/components/ui/back-button';

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
};

// eslint-disable-next-line react-refresh/only-export-components
export const sessionViewerLoader = (ctx: FolderHandleContextType) => {
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
      } satisfies LoaderResult;
    }

    const response = redirect(createHref({ type: 'Dashboard' }));
    throw response;
  };
};

export type ExpandedSavedSessionResult = SavedSessionResult & {
  Filename: string;
  MaxY: number;
  YTicks: number[];
  PlottedKeys: KeyManageType[];
};

export default function SessionViewerPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Evaluation, ExpandedSession, PlotObject, ShowKeys } = loaderResult;
  const [filteredKeys, setFilteredKeys] = useState(ShowKeys);

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
      <div className="w-full flex flex-row justify-between mb-4">
        <div className="flex flex-row gap-4">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-fit">
                <KeyboardIcon className="mr-2 w-4 h-4" />
                Edit Keys Displayed
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Toggle Visibility</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filteredKeys.map((key, index) => (
                <DropdownMenuCheckboxItem
                  key={`key-${index}`}
                  checked={key.Visible}
                  onCheckedChange={(checked) => {
                    const updatedKeys = filteredKeys.map((k) => {
                      if (k.KeyDescription === key.KeyDescription) {
                        return {
                          ...k,
                          Visible: checked,
                        };
                      }

                      return k;
                    });

                    setFilteredKeys(updatedKeys);

                    const hidden_keys = updatedKeys.filter((k) => k.Visible === false).map((k) => k.KeyDescription);

                    setLocalCachedPrefs(Group, Individual, Evaluation, `${Group} ${Individual} ${Evaluation}`, {
                      KeyDescription: hidden_keys,
                      CTBElements: [],
                      Schedule: 'End on Timer #1',
                    });
                  }}
                >
                  {key.KeyDescription}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex flex-col gap-1.5 grow">
            <CardTitle>Session Inspector</CardTitle>
            <CardDescription>Information Regarding Keys Illustrated Below</CardDescription>
          </div>
          <BackButton
            Label="Back to Session History"
            Href={createHref({
              type: 'Evaluation Session Viewer',
              group: Group,
              individual: Individual,
              evaluation: Evaluation,
            })}
          />
        </CardHeader>

        <CardContent className="w-full flex flex-col gap-2">
          <p>
            This page provides a visual and summary of the events recorded during the session. Due to differences in how
            duration and events are recorded, only events recorded reference the Y-axis. Duration keys are illustrated
            in terms of onset-offset visuals.
          </p>

          <SessionFigure Session={ExpandedSession} PlotData={PlotObject} KeysHidden={filteredKeys} />

          {ExpandedSession && (
            <div className="grid grid-cols-2 my-6 gap-2">
              <div>
                <span className="font-bold">Session #: </span> {ExpandedSession.SessionSettings.Session}
              </div>

              <div>
                <span className="font-bold">Session Date: </span>{' '}
                {new Date(ExpandedSession.SessionStart).toLocaleDateString()}
              </div>

              <div>
                <span className="font-bold">Session Condition: </span> {ExpandedSession.SessionSettings.Condition}
              </div>

              <div>
                <span className="font-bold">Session Ended Early?: </span>{' '}
                {ExpandedSession.EndedEarly === true ? 'Yes' : 'No'}
              </div>

              <div>
                <span className="font-bold">Data Collector: </span> {ExpandedSession.SessionSettings.Initials}
              </div>

              <div>
                <span className="font-bold">Data Rollector Role: </span> {ExpandedSession.SessionSettings.Role}
              </div>

              <div>
                <span className="font-bold">Therapist: </span> {ExpandedSession.SessionSettings.Therapist}
              </div>

              <div>
                <span className="font-bold">Keyset: </span> {ExpandedSession.SessionSettings.KeySet}
              </div>

              <div>
                <span className="font-bold">Session Duration: </span> {ExpandedSession.SessionSettings.DurationS}
              </div>

              <div>
                <span className="font-bold">Termination Rules: </span> {ExpandedSession.SessionSettings.TimerOption}
              </div>

              <div>
                <span className="font-bold">Timer Duration (Main): </span> {ExpandedSession.TimerMain.toFixed(2)}
              </div>

              <div>
                <span className="font-bold">Timer Duration (#1): </span> {ExpandedSession.TimerOne.toFixed(2)}
              </div>

              <div>
                <span className="font-bold">Timer Duration (#2): </span> {ExpandedSession.TimerTwo.toFixed(2)}
              </div>

              <div>
                <span className="font-bold">Timer Duration (#3): </span> {ExpandedSession.TimerThree.toFixed(2)}
              </div>
            </div>
          )}

          <SessionKeyList Session={ExpandedSession} />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
