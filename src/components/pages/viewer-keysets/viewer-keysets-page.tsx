import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
  BuildKeysetBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FolderHandleContext } from '@/context/folder-context';
import { GetAllKeyboardsQuery, GetHandleKeyboardsFolder } from '@/lib/files';
import { createNewKeySet, serializeKeySet } from '@/lib/keyset';
import { KeySetExtended } from '@/types/keyset';
import { ImportIcon } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

export default function ViewerKeysetPage() {
  const { handle } = useContext(FolderHandleContext);
  const [keySets, setKeysets] = useState<KeySetExtended[]>([]);
  const { Group, Individual } = useParams();

  useEffect(() => {
    GetAllKeyboardsQuery(handle).then((keyboards) => {
      const filteredKeyboards = keyboards.filter((keyboard) => keyboard.Individual !== Individual);

      setKeysets(filteredKeyboards);
    });
  }, [Individual, handle]);

  if (!Group || !Individual) return <div>Error</div>;

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
        BuildKeysetBreadcrumb(Group, Individual),
      ]}
      label={'Keyset Import'}
      className="select-none"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Keyset Import</CardTitle>
          <CardDescription>Import a keyset file to use in your evaluations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableHead>Group</TableHead>
              <TableHead>Individual</TableHead>
              <TableHead>Keyset Name</TableHead>
              <TableHead>Duration Keys</TableHead>
              <TableHead>Frequency Keys</TableHead>
              <TableHead></TableHead>
            </TableHeader>
            <TableBody>
              {keySets.map((keyset) => (
                <TableRow key={keyset.id}>
                  <TableCell>{keyset.Group}</TableCell>
                  <TableCell>{keyset.Individual}</TableCell>
                  <TableCell>{keyset.Name}</TableCell>
                  <TableCell>{keyset.DurationKeys.map((key) => key.KeyDescription).join(', ')}</TableCell>
                  <TableCell>{keyset.FrequencyKeys.map((key) => key.KeyDescription).join(', ')}</TableCell>
                  <TableCell>
                    <Button
                      variant={'outline'}
                      className="w-full"
                      onClick={async () => {
                        if (!Individual || !Group) throw new Error('Params missing.');
                        if (!handle) throw new Error('Handle missing.');

                        console.log('Importing keyset:', keyset);

                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { Group: grp1, Individual: ind1, ...rest } = keyset;

                        const keyboards_folder = await GetHandleKeyboardsFolder(handle, Group, Individual);

                        let keyboard_exists = false;

                        const entries = await keyboards_folder.values();
                        for await (const entry of entries) {
                          if (entry.name === rest.Name) {
                            keyboard_exists = true;
                            break;
                          }
                        }

                        if (keyboard_exists) {
                          window.alert('Keyset already exists');
                          return;
                        }

                        const key_set = createNewKeySet(rest.Name);
                        const key_set_mapped = {
                          ...key_set,
                          FrequencyKeys: rest.FrequencyKeys,
                          DurationKeys: rest.DurationKeys,
                        };

                        const key_board = await keyboards_folder.getFileHandle(`${rest.Name}.json`, {
                          create: true,
                        });

                        const writer = await key_board.createWritable();
                        await writer.write(serializeKeySet(key_set_mapped));
                        await writer.close();

                        toast.success('Imported successfully! Navigate to the editor to view the keyset.');
                      }}
                    >
                      <ImportIcon className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
