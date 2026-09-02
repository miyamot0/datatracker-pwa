import { queryClient } from '@/App';
import BackButton from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTable } from '@/components/ui/data-table-common';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import { CleanUpString } from '@/lib/strings';
import { mutationDeIdentifyIndividual } from '@/queries/individuals/mutate-deidentify-individual';
import { mutationIndividuals } from '@/queries/individuals/mutate-individuals';
import { ApplicationSettingsTypes } from '@/types/settings/application-settings';
import { useMutation } from '@tanstack/react-query';
import { Link, useRouter, useRouterState } from '@tanstack/react-router';
import { ColumnDef, Row } from '@tanstack/react-table';
import { ChevronDown, FolderInput, FolderPlus, UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

type ClientTableRow = {
  Individual: string;
};

/**
 * A client's new name must not collide with any existing client in the current group
 */
const buildDeIdentifySchema = (existingNames: string[]) =>
  z.object({
    NewName: z
      .string()
      .min(4, { message: 'The new name must be at least 4 characters long' })
      .max(128)
      .refine((name) => !existingNames.includes(name.trim()), {
        message: 'A client with this name already exists',
      }),
    BirthYear: z.coerce
      .number()
      .min(1970, { message: 'The birth year must be 1970 or later' })
      .max(2026, { message: 'The birth year must be 2026 or earlier' }),
    RedactComments: z.boolean().default(true),
  });

type DeIdentifySchemaType = z.infer<ReturnType<typeof buildDeIdentifySchema>>;

export default function ClientsPage({
  Group,
  Clients,
  Handle,
  Settings,
}: {
  Group: string;
  Clients: string[];
  Handle: FileSystemDirectoryHandle;
  Settings: ApplicationSettingsTypes;
}) {
  const router = useRouter();
  const routerState = useRouterState();
  const currentRouteId = routerState.matches[routerState.matches.length - 1]?.routeId;

  const mutateIndividuals = useMutation({
    mutationFn: mutationIndividuals,
    onSuccess: async (data) => {
      queryClient.setQueryData(['/', Group], data);

      await router.invalidate({
        filter: (match) => match.routeId === currentRouteId,
        sync: true,
      });
    },
  });

  const mutateDeIdentify = useMutation({
    mutationFn: mutationDeIdentifyIndividual,
    onSuccess: async (data) => {
      queryClient.setQueryData(['/', Group], data);

      await router.invalidate({
        filter: (match) => match.routeId === currentRouteId,
        sync: true,
      });
    },
  });

  const DynamicButtonList = ({ row }: { row: Row<ClientTableRow> }) => {
    const [testDialogOpen, setTestDialogOpen] = useState(false);

    const deIdentifySchema = buildDeIdentifySchema(Clients);

    const form = useForm<DeIdentifySchemaType>({
      defaultValues: {
        NewName: '',
        BirthYear: '' as unknown as number,
        RedactComments: true,
      },
      mode: 'onChange',
    });

    // validated manually (not via zodResolver) since @hookform/resolvers v3 is incompatible with zod v4
    const watchedValues = form.watch();
    const parseResult = deIdentifySchema.safeParse(watchedValues);
    const isFormValid = parseResult.success;

    useEffect(() => {
      form.clearErrors();
      if (!parseResult.success) {
        for (const issue of parseResult.error.issues) {
          const field = issue.path[0] as keyof DeIdentifySchemaType;
          form.setError(field, { type: 'manual', message: issue.message });
        }
      }
    }, [JSON.stringify(watchedValues)]);

    function onSubmit(values: DeIdentifySchemaType) {
      toast.promise(
        async () =>
          await mutateDeIdentify.mutateAsync({
            Group,
            SourceIndividual: row.original.Individual,
            NewIndividual: values.NewName.trim(),
            BirthYear: Number(values.BirthYear),
            RedactComments: values.RedactComments,
            Handle,
          }),
        {
          loading: 'De-identifying client...',
          success: () => {
            return 'Client de-identified successfully!';
          },
          error: (e: Error) => {
            return `An error occurred while de-identifying the client: ${e.message}`;
          },
        },
      );

      form.reset();
      setTestDialogOpen(false);
    }

    return (
      <>
        <Button size={'sm'} variant={'outline'} className="flex flex-row divide-x justify-between mx-0 px-0 shadow">
          <Link
            className="px-3 hover:underline flex flex-row items-center"
            to="/session/$group/$individual"
            params={{
              group: Group,
              individual: row.original.Individual,
            }}
          >
            <FolderInput className="mr-2 h-4 w-4" />
            Open Evaluations
          </Link>

          {Settings.EnableFileDeletion && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <ChevronDown className="w-fit px-2" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52" side="bottom" align="end" sideOffset={12}>
                <DropdownMenuItem onClick={() => setTestDialogOpen(true)}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  De-Identify Case
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </Button>

        <Dialog
          open={testDialogOpen}
          onOpenChange={(open) => {
            if (!open) form.reset();
            setTestDialogOpen(open);
          }}
        >
          <DialogContent className="bg-card select-none">
            <DialogHeader>
              <DialogTitle>De-Identify Case</DialogTitle>
              <DialogDescription>Provide a new name and service year for {row.original.Individual}.</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="NewName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the de-identified name" {...field} />
                      </FormControl>
                      <FormDescription>Must be at least 4 characters long</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="BirthYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth Year</FormLabel>
                      <FormControl>
                        <Input placeholder="2000" type="number" {...field} />
                      </FormControl>
                      <FormDescription>Must be between 1970 and 2026</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="RedactComments"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="flex flex-col gap-1">
                        <FormLabel>Redact session comments</FormLabel>
                        <FormDescription>Strip free-text comments from the de-identified copy</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full shadow" variant={'outline'} disabled={!isFormValid}>
                  Submit
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </>
    );
  };

  const columns: ColumnDef<ClientTableRow>[] = [
    {
      accessorKey: 'Individual',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Client Name/ID" />,
    },
    {
      accessorKey: 'Actions',
      header: () => <div className="text-right">Client Folder Actions</div>,
      cell: ({ row }) => (
        <div className="flex flex-row justify-end">
          <DynamicButtonList row={row} />
        </div>
      ),
    },
  ];

  return (
    <Card className="w-full max-w-screen-2xl">
      <CardHeader className="flex flex-col md:flex-row w-full justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Client Directory: {CleanUpString(Group)}</CardTitle>
          <CardDescription>Select clients to develop and evaluate outcomes</CardDescription>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <BackButton />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-1.5">
        <p>
          Each of the entries in the table below represent individual clients. You must have at least <i>one</i> client
          added to the group before you can begin collecting data (e.g., designing evaluations, adding conditions in
          evaluations).
        </p>

        <DataTable
          settings={Settings}
          columns={columns}
          data={Clients.map((g) => {
            return { Individual: g };
          })}
          callback={(rows) => {
            const individualNames = rows.map((row) => row.Individual);

            const confirm_delete = window.confirm(
              `Are you sure you want to delete ${individualNames.length} client(s)? This CANNOT be undone.`,
            );

            if (!confirm_delete) {
              return;
            }

            toast.promise(
              async () =>
                await mutateIndividuals.mutateAsync({
                  Group,
                  Individuals: individualNames,
                  Handle,
                  Action: 'Delete',
                }),
              {
                loading: 'Deleting client folders...',
                success: () => {
                  return 'Client folders have been deleted successfully!';
                },
                error: (e: Error) => {
                  return `An error occurred while deleting client folders: ${e.message}.`;
                },
              },
            );
          }}
          filterCol="Individual"
          optionalButtons={
            <ToolTipWrapper Label="Add a new client to current group">
              <Button
                variant={'outline'}
                className="shadow"
                size={'sm'}
                onClick={async () => {
                  const input = window.prompt('Enter a name for the new group.');

                  if (!input) return;

                  if (Clients.includes(input.trim())) {
                    window.alert('Client already exists.');
                    return;
                  }

                  if (input.trim().length < 4) {
                    window.alert('Client name must be at least 4 characters long.');
                    return;
                  }

                  toast.promise(
                    async () =>
                      await mutateIndividuals.mutateAsync({
                        Group,
                        Individuals: [input.trim()],
                        Handle,
                        Action: 'Add',
                      }),
                    {
                      loading: 'Creating individual folders...',
                      success: () => {
                        return 'New individual folder created!';
                      },
                      error: (e: Error) => {
                        return `An error occurred while adding individual folder: ${e.message}.`;
                      },
                    },
                  );
                }}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Create
              </Button>
            </ToolTipWrapper>
          }
        />
      </CardContent>
    </Card>
  );
}
