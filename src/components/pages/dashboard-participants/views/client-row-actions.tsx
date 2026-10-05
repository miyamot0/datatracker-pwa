import { queryClient } from '@/App';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { mutationDeIdentifyIndividual } from '@/queries/individuals/mutate-deidentify-individual';
import { ApplicationSettingsTypes } from '@/types/settings/application-settings';
import { useMutation } from '@tanstack/react-query';
import { Link, useRouter, useRouterState } from '@tanstack/react-router';
import { ChevronDown, FolderInput, UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { buildDeIdentifySchema, DeIdentifySchemaType } from '../helpers';

type Props = {
  Group: string;
  Individual: string;
  Clients: string[];
  Handle: FileSystemDirectoryHandle;
  Settings: ApplicationSettingsTypes;
};

/**
 * Per-row client actions: opening evaluations, and (when enabled) de-identifying the client
 */
export default function ClientRowActions({ Group, Individual, Clients, Handle, Settings }: Props) {
  const router = useRouter();
  const routerState = useRouterState();
  const currentRouteId = routerState.matches[routerState.matches.length - 1]?.routeId;

  const [testDialogOpen, setTestDialogOpen] = useState(false);

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

  const deIdentifySchema = buildDeIdentifySchema(Clients);

  const form = useForm<DeIdentifySchemaType>({
    defaultValues: {
      NewName: '',
      ReplacementYear: '' as unknown as number,
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
          SourceIndividual: Individual,
          NewIndividual: values.NewName.trim(),
          ReplacementYear: Number(values.ReplacementYear),
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
            individual: Individual,
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
              <DropdownMenuItem
                onClick={() => {
                  form.reset();
                  setTestDialogOpen(true);
                }}
              >
                <UserIcon className="mr-2 h-4 w-4" />
                De-Identify Case
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </Button>

      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="bg-card select-none">
          <DialogHeader>
            <DialogTitle>De-Identify Case</DialogTitle>
            <DialogDescription>Provide a new name and service year for {Individual}.</DialogDescription>
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
                name="ReplacementYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Replacement Year</FormLabel>
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
}
