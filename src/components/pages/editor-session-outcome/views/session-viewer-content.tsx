/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
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
import { setLocalCachedPrefs } from '@/lib/local_storage';
import BackButton from '@/components/ui/back-button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import SessionFigure from './session-figure';
import SessionKeyList from './session-key-list';
import { ExpandedSavedSessionResult } from '@/lib/dtos';
import { ToggleDisplayKey } from '@/types/visuals';
import { ApplicationSettingsTypes } from '@/types/settings/application-settings';

export default function SessionViewerContent({
  Group,
  Individual,
  Evaluation,
  ShowKeys,
  ExpandedSession,
  PlotObject,
  Settings,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  ShowKeys: ToggleDisplayKey[];
  ExpandedSession: ExpandedSavedSessionResult;
  PlotObject: any[];
  Settings: ApplicationSettingsTypes;
}) {
  // TODO: This should be pulling in the derived calcs already
  const [filteredKeys, setFilteredKeys] = useState(ShowKeys);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row justify-between">
        <div className="flex flex-col gap-1.5 grow">
          <CardTitle>Session Inspector</CardTitle>
          <CardDescription>Information Regarding Keys Illustrated Below</CardDescription>
        </div>

        <div className="flex flex-row gap-2">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-fit" size={'sm'}>
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
                      Schedule: 'End on Timer #1',
                    });
                  }}
                >
                  {key.KeyDescription}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <BackButton />
        </div>
      </CardHeader>

      <CardContent className="w-full flex flex-col gap-2">
        {ExpandedSession && (
          <div className="grid grid-cols-2 mb-6 gap-2">
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
              <span className="font-bold">Data Collector Role: </span> {ExpandedSession.SessionSettings.Role}
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

        <SessionFigure Session={ExpandedSession} PlotData={PlotObject} KeysHidden={filteredKeys} />

        <Separator className="my-4" />

        <SessionKeyList Settings={Settings} Session={ExpandedSession} />

        <Separator className="my-4" />

        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
            <h1>Comments:</h1>
            <div></div>
          </div>
          <Textarea minLength={3} value={ExpandedSession.Comments} readOnly />
        </div>
      </CardContent>
    </Card>
  );
}
