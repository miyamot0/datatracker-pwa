import { queryClient } from '@/App';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTable } from '@/components/ui/data-table-common';
import { mutateKeyboardsAll } from '@/queries/keysets/mutate-keyboards-all';
import { KeySet, KeySetExtended, KeySetInstance } from '@/types/keyset';
import { ApplicationSettingsTypes } from '@/types/settings/application-settings';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { ImportIcon } from 'lucide-react';
import { toast } from 'sonner';

type KeySetImportDisplayType = {
  Group: string;
  Individual: string;
  Name: string;
  DurationKeys: string;
  FrequencyKeys: string;
  OriginalKeyset: KeySet;
};

const remapKeysToString = (keys: KeySetInstance[]) => {
  return keys
    .map((key) => {
      return `${key.KeyDescription} (${key.KeyName.toUpperCase()})`;
    })
    .join(', ');
};

export default function ViewerKeysetPage({
  Group,
  Individual,
  Handle,
  Keysets,
  Settings,
}: {
  Group: string;
  Individual: string;
  Handle: FileSystemDirectoryHandle;
  Keysets: KeySetExtended[];
  Settings: ApplicationSettingsTypes;
}) {
  const router = useRouter();
  const routerState = useRouterState();
  const currentRouteId = routerState.matches[routerState.matches.length - 1]?.routeId;

  const mutateKeyboardsGlobal = useMutation({
    mutationFn: mutateKeyboardsAll,
    onSuccess: async (data) => {
      queryClient.setQueryData(['/', Group, 'metaKeyboards'], data);

      await queryClient.invalidateQueries({ queryKey: ['/', Group, Individual, 'keyboards'] });

      await router.invalidate({
        filter: (match) => match.routeId === currentRouteId || match.routeId === '/session/$group/$individual/keysets/',
        sync: true,
        forcePending: true,
      });
    },
  });

  const dataToDisplay: KeySetImportDisplayType[] = Keysets.map((record) => {
    return {
      Group: record.Group,
      Individual: record.Individual,
      Name: record.Name,
      DurationKeys: remapKeysToString(record.DurationKeys),
      FrequencyKeys: remapKeysToString(record.FrequencyKeys),
      OriginalKeyset: record,
    };
  });

  const columns: ColumnDef<KeySetImportDisplayType>[] = [
    {
      accessorKey: 'Group',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Group" />,
    },
    {
      accessorKey: 'Individual',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Individual" />,
    },
    {
      accessorKey: 'Name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="KeySet Name" />,
    },

    {
      accessorKey: 'DurationKeys',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Duration Keys" />,
    },

    {
      accessorKey: 'FrequencyKeys',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Frequency Keys" />,
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row justify-between">
        <div className="flex flex-col gap-1.5 grow">
          <CardTitle>Keyset Import</CardTitle>
          <CardDescription>Import a keyset file to use in your evaluations.</CardDescription>
        </div>
        <BackButton />
      </CardHeader>

      <CardContent className="flex flex-col gap-1.5">
        <p>
          This page lists keysets that have been created for those <i>other than</i> the current client. Each keyset is
          a collection of keys that specify a key-behavior relationship.
        </p>

        <DataTable
          settings={Settings}
          columns={columns}
          data={dataToDisplay}
          forceShowCheckbox
          filterCol="Name"
          customCheckboxButton={
            <>
              <ImportIcon className="h-4 w-4 mr-2" />
              Import KeySet(s)
            </>
          }
          callback={(rows) => {
            const keysetsToImport = rows.map((row) => row.OriginalKeyset);

            toast.promise(
              async () =>
                await mutateKeyboardsGlobal.mutateAsync({
                  Handle,
                  Group,
                  Individual,
                  KeySets: keysetsToImport,
                }),
              {
                loading: 'Importing keyset...',
                success: () => {
                  return 'KeySets have been imported successfully!';
                },
                error: (e: Error) => {
                  return `An error occurred while importing KeySets: ${e.message}.`;
                },
              },
            );
          }}
        />
      </CardContent>
    </Card>
  );
}
