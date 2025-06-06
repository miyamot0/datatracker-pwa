import PageWrapper from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DataCollectorRoles,
  SessionDesignerSchema,
  SessionDesignerSchemaType,
  SessionTerminationOptionsDescriptions,
} from '@/forms/schema/session-designer-schema';
import { CleanUpString } from '@/lib/strings';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SavedSettings, toSavedSettings } from '@/lib/dtos';
import { KeySet } from '@/types/keyset';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FolderHandleContextType } from '@/context/folder-context';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { displayConditionalNotification } from '@/lib/notifications';
import { FolderPlus } from 'lucide-react';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import { useNavigate } from 'react-router-dom';
import createHref from '@/lib/links';
import { GetHandleEvaluationFolder } from '@/lib/files';
import BackButton from '@/components/ui/back-button';

type Props = {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
  Evaluation: string;
  Conditions: string[];
  Keysets: KeySet[];
  KeysetFilenames: string[];
  SetConditions: Dispatch<SetStateAction<string[]>>;
  Context: FolderHandleContextType;
  SessionSettings: SavedSettings;
};

export default function SessionDesigner({
  Handle,
  Group,
  Individual,
  Evaluation,
  Conditions,
  Keysets,
  KeysetFilenames,
  SetConditions,
  SessionSettings,
  Context,
}: Props) {
  const { handle, settings } = Context;
  const navigate = useNavigate();

  const form = useForm<SessionDesignerSchemaType>({
    resolver: zodResolver(SessionDesignerSchema),
    values: {
      SessionTherapistID: '',
      SessionKeySet: '',
      SessionDurationS: 600,
      SessionTerminationOption: 'End on Timer #1',
      SessionNumber: 1,
      SessionCondition: '',
      DataCollectorID: '',
      DataCollectorRole: 'Primary',
    },
    mode: 'onChange',
  });
  const [keySet, setKeySet] = useState<KeySet | undefined>(undefined);

  useEffect(() => {
    form.setValue('SessionKeySet', SessionSettings.KeySet);
    form.setValue('DataCollectorID', SessionSettings.Initials);
    form.trigger('DataCollectorID');

    form.setValue('SessionTherapistID', SessionSettings.Therapist);
    form.trigger('SessionTherapistID');

    form.setValue('SessionDurationS', SessionSettings.DurationS);
    form.setValue('SessionTerminationOption', SessionSettings.TimerOption);
    form.setValue('SessionNumber', SessionSettings.Session);

    form.setValue('SessionCondition', SessionSettings.Condition);
    form.trigger('SessionCondition');

    form.setValue('DataCollectorRole', SessionSettings.Role);
    form.trigger('DataCollectorRole');

    if (SessionSettings.KeySet.trim().length > 0) {
      const keyset_default = Keysets.find((keyset) => keyset.Name === SessionSettings.KeySet);

      if (keyset_default) setKeySet(keyset_default);
    }

    form.trigger('SessionKeySet');

    return () => {};
  }, [Evaluation, Group, Handle, Individual, form, Keysets, settings, SessionSettings]);

  function onSubmit(values: z.infer<typeof SessionDesignerSchema>) {
    const newer_settings = toSavedSettings(values);

    GetHandleEvaluationFolder(Handle, CleanUpString(Group), CleanUpString(Individual), CleanUpString(Evaluation))
      .then(async (files) => {
        if (!files) throw new Error('No directory found for this evaluation');

        const settings_file = await files.getFileHandle('settings.json', {
          create: true,
        });
        const writer = await settings_file.createWritable();
        await writer.write(JSON.stringify(newer_settings));
        await writer.close();

        navigate(`/session/${CleanUpString(Group)}/${CleanUpString(Individual)}/${CleanUpString(Evaluation)}/run`, {
          unstable_viewTransition: true,
        });
      })
      .catch(() => {
        //console.error(error);
      });
  }

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
      ]}
      label={`Design ${CleanUpString(Evaluation)} Session`}
      className="select-none"
    >
      <div className="w-full grid grid-cols-3 gap-2 max-w-screen-2xl">
        <Card className="w-full col-span-2">
          <CardHeader className="flex flex-row w-full justify-between">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Session Designer</CardTitle>
              <CardDescription>Specify your conditions for the session on this page</CardDescription>
            </div>
            <div className="flex flex-row gap-2">
              <ToolTipWrapper Label="Add a new Condition for this Evaluation">
                <Button
                  variant={'outline'}
                  className="shadow"
                  size={'sm'}
                  onClick={async () => {
                    const input = window.prompt('Enter the name for the new condition.');

                    if (!input) return;

                    if (Conditions.includes(input.trim())) {
                      displayConditionalNotification(
                        settings,
                        'Error Adding Condition',
                        'The condition provided already exists',
                        3000,
                        true
                      );

                      return;
                    }

                    if (input.trim().length > 0) {
                      const evaluations_folder = await GetHandleEvaluationFolder(
                        handle!,
                        Group,
                        Individual,
                        Evaluation
                      );

                      await evaluations_folder.getDirectoryHandle(input, {
                        create: true,
                      });

                      SetConditions([...Conditions, input.trim()]);

                      displayConditionalNotification(
                        settings,
                        'Condition Added',
                        `The condition '${input}' has been added`
                      );
                    }
                  }}
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Add Condition
                </Button>
              </ToolTipWrapper>

              <BackButton
                Label="Back to Evaluations"
                Href={createHref({
                  type: 'Evaluations',
                  group: Group,
                  individual: Individual,
                })}
              />
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="SessionCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Condition</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.trigger('SessionCondition');
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="dark:bg-background">
                            <SelectValue placeholder="Select condition for evaluation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Available Conditions</SelectLabel>
                            {Conditions.map((keyset) => (
                              <SelectItem key={keyset} value={keyset}>
                                {keyset}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormDescription>Which condition does this session correspond to?</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="SessionKeySet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session KeySet</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setKeySet(Keysets.find((keyset) => keyset.Name === value));

                          form.trigger('SessionKeySet');
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="dark:bg-background">
                            <SelectValue placeholder="Select keyset for session" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Available KeySet Files</SelectLabel>
                            {KeysetFilenames.map((keyset) => (
                              <SelectItem key={keyset} value={keyset}>
                                {keyset}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormDescription>Select the specific KeySet to load for this session</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="SessionTherapistID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Therapist ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the ID for the session therapist" {...field} />
                      </FormControl>
                      <FormDescription>Enter the ID for the session therapist (e.g., initials)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="DataCollectorID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Collector ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Initials of data collector" {...field} />
                      </FormControl>
                      <FormDescription>Enter your ID as the session data collector (e.g., initials)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="DataCollectorRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role as Data Collector</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="dark:bg-background">
                            <SelectValue placeholder="Select role as data collector" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Data Collection Role</SelectLabel>
                            {Object.values(DataCollectorRoles).map((role) => (
                              <SelectItem key={role} value={role}>
                                {role} Data Collector
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Specify whether you are the PRIMARY or RELIABILITY data collector
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="SessionDurationS"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Length</FormLabel>
                      <FormControl>
                        <Input placeholder="600" type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Assign the length of the session in seconds (Default = 600 seconds)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="SessionNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Number</FormLabel>
                      <FormControl>
                        <Input placeholder="1" step={1} type="number" {...field} />
                      </FormControl>
                      <FormDescription>Assign the session number for the client (Default = 1)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="SessionTerminationOption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Termination Option</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="dark:bg-background">
                            <SelectValue placeholder="Select role as data collector" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Session Timers</SelectLabel>
                            {SessionTerminationOptionsDescriptions.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.description}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormDescription>Select WHICH timer should be used to terminate the session</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button variant={'outline'} className="w-full" type="submit">
                  Run Session
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-2">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Frequency Keys</CardTitle>
              <CardDescription>Keys in current set</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target</TableHead>
                    <TableHead>Key</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keySet &&
                    keySet.FrequencyKeys.map((key, index) => (
                      <TableRow key={index}>
                        <TableCell>{key.KeyDescription}</TableCell>
                        <TableCell>{key.KeyName}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Duration Keys</CardTitle>
              <CardDescription>Keys in current set</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target</TableHead>
                    <TableHead>Key</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keySet &&
                    keySet.DurationKeys.map((key, index) => (
                      <TableRow key={index}>
                        <TableCell>{key.KeyDescription}</TableCell>
                        <TableCell>{key.KeyName}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
