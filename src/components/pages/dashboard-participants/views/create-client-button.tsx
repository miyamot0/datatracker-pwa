import { queryClient } from '@/App';
import { Button } from '@/components/ui/button';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import { mutationIndividuals } from '@/queries/individuals/mutate-individuals';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { validateNewClientName } from '../helpers';

type Props = {
  Group: string;
  Clients: string[];
  Handle: FileSystemDirectoryHandle;
};

/**
 * Prompt-driven button for adding a new client to the current group
 */
export default function CreateClientButton({ Group, Clients, Handle }: Props) {
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

  return (
    <ToolTipWrapper Label="Add a new client to current group">
      <Button
        variant={'outline'}
        className="shadow"
        size={'sm'}
        onClick={async () => {
          const input = window.prompt('Enter a name for the new group.');

          if (!input) return;

          const validationError = validateNewClientName(input, Clients);
          if (validationError) {
            window.alert(validationError);
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
  );
}
