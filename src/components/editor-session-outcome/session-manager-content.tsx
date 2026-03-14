import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useContext, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyManageType } from '../session-recorder/types/session-recorder-types';
import { Button } from '@/components/ui/button';
import { Pencil1Icon } from '@radix-ui/react-icons';
import { DeleteIcon, SaveIcon } from 'lucide-react';
import BackButton from '@/components/ui/back-button';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import { toast } from 'sonner';
import { ModifiedSessionResult } from '@/types/storage';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { FolderHandleContext } from '@/context/folder-context';
import { SavedSessionResult } from '@/lib/dtos';
import { useMutation } from '@tanstack/react-query';
import { mutationSettingsOutcomes } from '@/queries/outcomes/mutate-session-outcomes';
import { queryClient } from '@/App';

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

export default function SessionManagerContent({
  Group,
  Individual,
  Evaluation,
  Session,
  SavedKeys,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  Session: ModifiedSessionResult;
  SavedKeys: KeyManageType[];
}) {
  const mutateSessionOutcomes = useMutation({
    mutationFn: mutationSettingsOutcomes,
    onSuccess: (data) => {
      queryClient.setQueryData(['/', Group, Individual, Evaluation, 'outcomes'], data);
    },
  });

  const { handle } = useContext(FolderHandleContext);

  const [currentKeys, setCurrentKeys] = useState(SavedKeys);
  const textareaRef = useRef(null);

  const allKeys = [Session.Keyset.FrequencyKeys, Session.Keyset.DurationKeys].flat();

  async function saveUpdatedSession() {
    const textAreaValue = textareaRef.current && (textareaRef.current as HTMLTextAreaElement).value;
    const savedSessionData = {
      ...Session,
      FrequencyKeyPresses: currentKeys.filter((key) => key.KeyType === 'Frequency'),
      DurationKeyPresses: currentKeys.filter((key) => key.KeyType === 'Duration'),
      Comments: textAreaValue || '',
    } satisfies SavedSessionResult;

    await mutateSessionOutcomes.mutateAsync({
      Handle: handle!,
      Group,
      Individual,
      Evaluation,
      PriorOutcome: Session,
      UpdatedOutcome: savedSessionData,
      Outcomes: [],
      Action: 'Modify',
    });
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row w-full justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Session Record Manager ({Session.Filename})</CardTitle>
          <CardDescription>Note: Edits to current session file must be manually saved</CardDescription>
        </div>
        <div className="flex flex-row gap-2">
          <ToolTipWrapper Label="Do you want to save the current key presses to the session file?">
            <Button
              variant={'outline'}
              className="shadow"
              size={'sm'}
              onClick={() => {
                const confirm_save = window.confirm(
                  'Are you sure you want to save the changes made to this session file?',
                );

                if (!confirm_save) {
                  return;
                }

                toast.promise(async () => await saveUpdatedSession(), {
                  loading: 'Saving updated session...',
                  success: () => {
                    return 'Session file has been updated successfully!';
                  },
                  error: (e: Error) => {
                    return `An error occurred while saving the session file: ${e.message}.`;
                  },
                });
              }}
            >
              <SaveIcon className="mr-2 h-4 w-4" />
              Update File
            </Button>
          </ToolTipWrapper>

          <BackButton />
        </div>
      </CardHeader>
      <CardContent>
        <div>
          <p>
            <span className="font-semibold">Session #:</span> {Session.SessionSettings.Session}
          </p>

          <p>
            <span className="font-semibold">Session Date:</span> {new Date(Session.SessionStart).toLocaleDateString()}
          </p>
          <p>
            <span className="font-semibold">Session Time:</span> {new Date(Session.SessionStart).toLocaleTimeString()}
          </p>

          <p>
            <span className="font-semibold">Evaluation:</span> {Evaluation}
          </p>

          <p>
            <span className="font-semibold">Condition:</span> {Session.SessionSettings.Condition}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Time Pressed</TableHead>
              <TableHead>Time into Session</TableHead>
              <TableHead>Key Recorded</TableHead>
              <TableHead className="flex flex-row justify-end">Action</TableHead>
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
                  <TableCell className="flex flex-row justify-end">
                    <div className="flex flex-row gap-1">
                      <Button
                        variant={'destructive'}
                        className="text-primary flex flex-row gap-1 items-center"
                        disabled={!(key.KeyType === 'Frequency' || key.KeyType === 'Duration')}
                        onClick={() => {
                          const confirm_delete = window.confirm(
                            `Are you sure you want to delete the key press of "${
                              key.KeyDescription
                            }" recorded at ${key.TimeIntoSession.toFixed(2)} seconds? This action cannot be undone.`,
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
                            }),
                          );
                        }}
                      >
                        <Pencil1Icon className="h-4 w-4" />
                        Replace Key
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Separator className="my-4" />

        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
            <h1>Comments:</h1>
            <div></div>
          </div>
          <Textarea ref={textareaRef} minLength={3} defaultValue={Session.Comments} />
        </div>
      </CardContent>
    </Card>
  );
}
