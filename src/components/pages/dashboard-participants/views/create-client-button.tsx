import { queryClient } from '@/App';
import { Button } from '@/components/ui/button';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import { useNameDialog } from '@/components/dialogs/use-name-dialog';
import { mutationIndividuals } from '@/queries/individuals/mutate-individuals';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { FolderPlus } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  Group: string;
  Clients: string[];
  Handle: FileSystemDirectoryHandle;
};

/**
 * Opens a name dialog to add a new client to the current group
 */
export default function CreateClientButton({ Group, Clients, Handle }: Props) {
  const router = useRouter();
  const routerState = useRouterState();
  const currentRouteId = routerState.matches[routerState.matches.length - 1]?.routeId;
  const { openNameDialog, nameDialog } = useNameDialog();

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

  return (
    <>
      <ToolTipWrapper Label="Add a new client to current group">
        <Button
          variant={'outline'}
          className="shadow"
          size={'sm'}
          onClick={() =>
            openNameDialog({
              title: 'Add a New Client',
              entityLabel: 'Client',
              submitLabel: 'Create client',
              existingNames: Clients,
              onSubmit: (name) => {
                toast.promise(
                  async () =>
                    await mutateIndividuals.mutateAsync({
                      Group,
                      Individuals: [name],
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
              },
            })
          }
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          Create
        </Button>
      </ToolTipWrapper>
      {nameDialog}
    </>
  );
}
