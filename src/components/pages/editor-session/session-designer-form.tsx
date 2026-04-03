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
  SessionDesignerSchema,
  SessionDesignerSchemaType,
} from '@/components/pages/editor-session/session-designer-schema';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SavedSettings, toSavedSettings } from '@/lib/dtos/session-settings';
import { KeySet } from '@/types/keyset';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { displayConditionalNotification } from '@/lib/notifications';
import { FolderMinus, FolderPlus } from 'lucide-react';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import BackButton from '@/components/ui/back-button';
import { mutationConditions } from '@/queries/conditions/mutate-conditions';
import { useMutation } from '@tanstack/react-query';
import { mutationSettingsParams } from '@/queries/session/mutate-session-params';
import { queryClient } from '@/App';
import { useNavigate, useRouter, useRouterState } from '@tanstack/react-router';
import { toast } from 'sonner';
import { DataCollectorRoles } from '@/types/roles';
import { filteredSessionTerminationOptions, SessionTerminationOptionsDescriptions } from '@/types/terminations';
import { ApplicationSettingsTypes } from '@/types/settings/application-settings';

type Props = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Conditions: string[];
  Keysets: KeySet[];
  SessionSettings: SavedSettings;
  Settings: ApplicationSettingsTypes;
  Handle: FileSystemDirectoryHandle;
};

export default function SessionDesigner({
  Group,
  Individual,
  Evaluation,
  Conditions,
  Keysets,
  SessionSettings,
  Settings,
  Handle,
}: Props) {
  const router = useRouter();
  const routerState = useRouterState();
  const currentRouteId = routerState.matches[routerState.matches.length - 1]?.routeId;

  const navigate = useNavigate({
    from: `/session/$group/$individual/$evaluation/`,
  });

  const form = useForm<SessionDesignerSchemaType>({
    resolver: zodResolver(SessionDesignerSchema),
    values: {
      SessionTherapistID: SessionSettings.Therapist,
      SessionKeySet: SessionSettings.KeySet,
      SessionDurationS: SessionSettings.DurationS,
      SessionTerminationOption: SessionSettings.TimerOption.toString(),
      SessionNumber: SessionSettings.Session,
      SessionCondition: SessionSettings.Condition,
      DataCollectorID: SessionSettings.Initials,
      DataCollectorRole: SessionSettings.Role,
    },
    mode: 'onChange',
  });

  const mutateConditions = useMutation({
    mutationFn: mutationConditions,
    onSuccess: async (data) => {
      queryClient.setQueryData(['/', Group, Individual, Evaluation, 'conditions'], data);
      form.resetField('SessionCondition', {});

      await router.invalidate({
        filter: (match) =>
          match.routeId === currentRouteId || match.routeId === '/session/$group/$individual/$evaluation/run/$keyset',
        sync: true,
      });
    },
  });

  const mutateSettings = useMutation({
    mutationFn: mutationSettingsParams,
    onSuccess: async (data) => {
      queryClient.setQueryData(['/', Group, Individual, Evaluation, 'settings'], data);

      await navigate({
        to: '/session/$group/$individual/$evaluation/run/$keyset',
        params: {
          group: Group,
          individual: Individual,
          evaluation: Evaluation,
          keyset: data.KeySet,
        },
      });
    },
  });

  const [keySet, setKeySet] = useState<KeySet | undefined>(Keysets.find((k) => k.Name === SessionSettings.KeySet));

  async function onSubmit(values: z.infer<typeof SessionDesignerSchema>) {
    const newer_settings = toSavedSettings(values);

    await mutateSettings.mutateAsync({ Group, Individual, Evaluation, Handle: Handle, Settings: newer_settings });
  }

  return (
    <div className="w-full grid grid-cols-3 gap-2 max-w-screen-2xl">
      <Card className="w-full col-span-2 h-fit">
        <CardHeader className="flex flex-row w-full justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Session Designer</CardTitle>
            <CardDescription>Specify your conditions for the session on this page</CardDescription>
          </div>
          <BackButton />
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-row justify-between gap-2 my-0 py-0">
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
                      Settings,
                      'Error Adding Condition',
                      'The condition provided already exists',
                      3000,
                      true,
                    );

                    return;
                  }

                  if (input.trim().length > 0) {
                    toast.promise(
                      async () =>
                        await mutateConditions.mutateAsync({
                          Group,
                          Individual,
                          Evaluation,
                          Condition: input.trim(),
                          Handle,
                          Action: 'Add',
                        }),
                      {
                        loading: 'Adding condition...',
                        success: () => {
                          return 'Condition has been added successfully!';
                        },
                        error: (e: Error) => {
                          return `An error occurred while adding the condition: ${e.message}`;
                        },
                      },
                    );
                  }
                }}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Add New Condition
              </Button>
            </ToolTipWrapper>

            <ToolTipWrapper Label="Clear the empty conditions for this evaluation?">
              <Button
                variant={'outline'}
                className="shadow"
                size={'sm'}
                onClick={async () => {
                  const confirm_delete = window.confirm(
                    `Are you sure you wish to delete empty evaluation conditions? This CANNOT be undone.`,
                  );

                  if (!confirm_delete) return;

                  toast.promise(
                    async () =>
                      await mutateConditions.mutateAsync({
                        Group,
                        Individual,
                        Evaluation,
                        Condition: '',
                        Handle,
                        Action: 'Clear',
                      }),
                    {
                      loading: 'Clearing empty conditions...',
                      success: () => {
                        return 'Empty conditions have been cleared successfully!';
                      },
                      error: (e: Error) => {
                        return `An error occurred while clearing empty conditions: ${e.message}`;
                      },
                    },
                  );
                }}
              >
                <FolderMinus className="mr-2 h-4 w-4" />
                Clear Empty Condition(s)
              </Button>
            </ToolTipWrapper>
          </div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              onChange={async () => {
                if (Settings.CacheBehavior === 'aggressive') {
                  try {
                    const formVals = form.getValues();

                    await router.preloadRoute({
                      to: '/session/$group/$individual/$evaluation/run/$keyset',
                      params: {
                        group: Group,
                        individual: Individual,
                        evaluation: Evaluation,
                        keyset: formVals.SessionKeySet,
                      },
                    });
                  } catch (err) {
                    console.error('Error preloading route:', err);
                  }
                }
              }}
              className="space-y-6"
            >
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

                        const newKeySet = Keysets.find((keyset) => keyset.Name === value);
                        setKeySet(newKeySet);

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
                          {Keysets.map((k) => (
                            <SelectItem key={k.id} value={k.Name}>
                              {k.Name}
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
                    <FormDescription>Specify whether you are the PRIMARY or RELIABILITY data collector</FormDescription>
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
                          {filteredSessionTerminationOptions(Settings).map((option) => {
                            const description =
                              SessionTerminationOptionsDescriptions.find((o) => o.value === option)?.description ||
                              option;
                            return (
                              <SelectItem key={option} value={option}>
                                {description}
                              </SelectItem>
                            );
                          })}
                          {keySet &&
                            keySet.SpecialDurationKeys.map((key) => {
                              return (
                                <SelectItem key={key.KeyDescription} value={key.KeyCode.toString()}>
                                  {`End on ${key.KeyDescription} Time Specifically (When ${key.KeyDescription} > Duration)`}
                                </SelectItem>
                              );
                            })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormDescription>Select WHICH timer should be used to terminate the session</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button variant={'outline'} className="w-full shadow" type="submit">
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

                {keySet &&
                  keySet.SpecialDurationKeys.map((key, index) => (
                    <TableRow key={index} className="bg-muted">
                      <TableCell>{key.KeyDescription} (Timing Key)</TableCell>
                      <TableCell>{key.KeyName}</TableCell>
                    </TableRow>
                  ))}

                {keySet &&
                  keySet.ScorableDurationKeys.map((key, index) => (
                    <TableRow key={index} className="bg-muted">
                      <TableCell>{key.KeyDescription} (Scoring Key)</TableCell>
                      <TableCell>{key.KeyName}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
