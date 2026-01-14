/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { redirect, useLoaderData } from 'react-router-dom';
import { FolderHandleContextType } from '@/context/folder-context';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { GetHandleEvaluationFolder, GetResultsFromEvaluationFolder } from '@/lib/files';
import { GenerateSavedFileName } from '@/lib/writer';
import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildSessionHistoryBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyManageType } from '../session-recorder/types/session-recorder-types';
import { Button } from '@/components/ui/button';
import { Pencil1Icon } from '@radix-ui/react-icons';
import { DeleteIcon, SaveIcon } from 'lucide-react';
import BackButton from '@/components/ui/back-button';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import { SavedSessionResult } from '@/lib/dtos';

type LoaderResult = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Condition: string;
  Handle: FileSystemDirectoryHandle;
  //PlotObject: any[];
  Session: SavedSessionResult;
  SavedKeys: KeyManageType[];
  //ExpandedSession: ExpandedSavedSessionResult;
  //ShowKeys: {
  //  KeyDescription: string;
  //  Visible: boolean;
  //}[];
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
      /*
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
      */

      const saved_keys = [
        ...relevant_session.FrequencyKeyPresses,
        ...relevant_session.DurationKeyPresses,
        ...relevant_session.SystemKeyPresses,
      ].sort((a, b) => a.TimeIntoSession - b.TimeIntoSession);

      /*
      const expandedSessionData = {
        ...relevant_session,
        Filename: GenerateSavedFileName(relevant_session.SessionSettings),
        //MaxY: max_y + 1,
        //YTicks: y_ticks,
        PlottedKeys: saved_keys,
      };
      */

      //const stored_prefs = getLocalCachedPrefs(Group, Individual, Evaluation, `${Group} ${Individual} ${Evaluation}`);

      /*
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
      */

      return {
        Group: CleanUpString(Group),
        Individual: CleanUpString(Individual),
        Evaluation: CleanUpString(Evaluation),
        Condition: CleanUpString(relevant_session.SessionSettings.Condition),
        Handle: handle,
        Session: relevant_session,
        SavedKeys: saved_keys,
        //PlotObject: plot_object,
        //ExpandedSession: expandedSessionData,
        //ShowKeys: show_keys_base,
        Context: ctx,
      } satisfies LoaderResult;
    }

    const response = redirect(createHref({ type: 'Dashboard' }));
    throw response;
  };
};

function ColoredDot({ KeyObject }: { KeyObject: KeyManageType }) {
  let key_color = '#fff';

  switch (KeyObject.KeyType) {
    case 'System':
      key_color = '#000';
      break;
    case 'Frequency':
      key_color = '#fff';
      break;
    case 'Duration':
      key_color = '#fff';
      break;
    case 'Timing':
      key_color = '#777';
      break;
  }

  return (
    <span
      style={{
        height: '10px',
        width: '10px',
        backgroundColor: key_color,
        borderColor: '#000',
        borderRadius: '75%',
        display: 'inline-block',
      }}
    ></span>
  );
}

export default function SessionManagerPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Evaluation, Session, SavedKeys, Handle } = loaderResult;

  const [currentKeys, setCurrentKeys] = useState(SavedKeys);

  const allKeys = [Session.Keyset.FrequencyKeys, Session.Keyset.DurationKeys].flat();

  async function saveUpdatedSession() {
    //const { Filename, ...SessionParams } = ExpandedSession;

    const client_evaluations_folder = await GetHandleEvaluationFolder(
      Handle,
      CleanUpString(Group),
      CleanUpString(Individual),
      CleanUpString(Evaluation)
    );

    const relevent_condition_folder = await client_evaluations_folder.getDirectoryHandle(
      CleanUpString(Session.SessionSettings.Condition),
      {
        create: true,
      }
    );

    const saved_session_data = {
      ...Session,
      FrequencyKeyPresses: currentKeys.filter((key) => key.KeyType === 'Frequency'),
      DurationKeyPresses: currentKeys.filter((key) => key.KeyType === 'Duration'),
    } satisfies SavedSessionResult;

    const session_output_file = await relevent_condition_folder.getFileHandle(
      `${Session.SessionSettings.Session}_${Session.SessionSettings.Condition}_${Session.SessionSettings.Role}.json`,
      { create: true }
    );

    //console.log(session_output_file.name);

    const writer = await session_output_file.createWritable();
    await writer.write(JSON.stringify(saved_session_data));

    return await writer.close();
  }

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
      <Card className="w-full">
        <CardHeader className="flex flex-row w-full justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Session Record Manager</CardTitle>
            <CardDescription>List of keys in current session file</CardDescription>
          </div>
          <div className="flex flex-row gap-2">
            <ToolTipWrapper Label="Add a new Condition for this Evaluation">
              <Button variant={'outline'} className="shadow" size={'sm'} onClick={() => saveUpdatedSession()}>
                <SaveIcon className="mr-2 h-4 w-4" />
                Update File
              </Button>
            </ToolTipWrapper>

            <BackButton
              Label="Back to Session History"
              Href={createHref({
                type: 'Evaluation Session Viewer',
                group: Group,
                individual: Individual,
                evaluation: Evaluation,
              })}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Time Pressed</TableHead>
                <TableHead>Time into Session</TableHead>
                <TableHead>Key Recorded</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentKeys.map((key, index) => {
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <ColoredDot KeyObject={key} /> {key.KeyDescription}
                    </TableCell>
                    <TableCell>{key.KeyName}</TableCell>
                    <TableCell>{new Date(key.TimePressed).toLocaleTimeString()}</TableCell>
                    <TableCell>{key.TimeIntoSession.toFixed(2)} seconds</TableCell>
                    <TableCell className="flex flex-row gap-1">
                      <Button
                        variant={'destructive'}
                        className="text-primary flex flex-row gap-1 items-center"
                        disabled={!(key.KeyType === 'Frequency' || key.KeyType === 'Duration')}
                        onClick={() => {
                          const confirm_delete = window.confirm(
                            `Are you sure you want to delete the key press of "${
                              key.KeyDescription
                            }" recorded at ${key.TimeIntoSession.toFixed(2)} seconds? This action cannot be undone.`
                          );

                          if (!confirm_delete) return;

                          setCurrentKeys((prevKeys) => prevKeys.filter((_, i) => i !== index));
                        }}
                      >
                        <DeleteIcon className="h-4 w-4" />
                        Delete Key
                      </Button>
                      <Button
                        variant={'outline'}
                        className="text-primary flex flex-row gap-1 items-center"
                        disabled={!(key.KeyType === 'Frequency' || key.KeyType === 'Duration')}
                        onClick={() => {
                          const allKeysString = allKeys
                            .filter((k) => k.KeyDescription !== key.KeyDescription)
                            .map((k) => `${k.KeyName} (${k.KeyDescription})`)
                            .join(', ');

                          const prompt_message = `Current Key: "${key.KeyName} (${key.KeyDescription})"\n\nAvailable Keys: ${allKeysString}\n\nPlease enter the Key you want to replace it with:`;
                          const new_key_name = window.prompt(prompt_message);
                          const check_if_valid = allKeys.find((k) => k.KeyName === new_key_name);

                          if (!new_key_name || !check_if_valid) {
                            window.alert('Invalid key name entered. No changes made.');
                            return;
                          }

                          setCurrentKeys((prevKeys) =>
                            prevKeys.map((k, i) => {
                              if (i === index) {
                                return {
                                  ...k,
                                  KeyName: new_key_name,
                                  KeyDescription: check_if_valid.KeyDescription,
                                  KeyCode: check_if_valid.KeyCode,
                                };
                              }
                              return k;
                            })
                          );
                        }}
                      >
                        <Pencil1Icon className="h-4 w-4" />
                        Replace Key
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
