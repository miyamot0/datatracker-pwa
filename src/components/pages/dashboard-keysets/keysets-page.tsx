'use client';

import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingDisplay from '@/components/ui/loading-display';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ToolTipWrapper from '@/components/ui/tooltip-wrapper';
import { FolderHandleContext } from '@/context/folder-context';
import { getClientKeyboards, GetHandleKeyboardsFolder } from '@/lib/files';
import { createNewKeySet, serializeKeySet } from '@/lib/keyset';
import createHref from '@/lib/links';
import { LoadingStructureKeysets } from '@/types/working';
import { Edit2, Plus } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function KeySetsPage() {
  const { Group, Individual } = useParams();
  const { handle } = useContext(FolderHandleContext);

  const [keysets, setKeysets] = useState<LoadingStructureKeysets>({
    Status: 'loading',
    KeySets: [],
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!handle || !Group || !Individual) {
      navigate(createHref({ type: 'Dashboard' }));
      return;
    }

    getClientKeyboards(handle, Group, Individual, setKeysets);
  }, [handle, navigate, Group, Individual]);

  if (!handle) return <LoadingDisplay />;

  if (!Group || !Individual || !handle) {
    throw new Error('Params missing.');
  }

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
      ]}
      label={'Keysets'}
    >
      <Card className="w-full max-w-screen-2xl">
        <CardHeader className="flex flex-col md:flex-row w-full justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Keysets</CardTitle>
            <CardDescription>View/Edit Keysets for {Individual}</CardDescription>
          </div>
          <ToolTipWrapper Label="Create a new KeySet for individual">
            <Button
              variant={'outline'}
              className="shadow"
              onClick={async () => {
                const new_keyset_name = window && window.prompt('Enter the name of the keyset');

                if (!new_keyset_name) return;

                if (new_keyset_name.trim().length < 4) {
                  window.alert('Keyset name must be at least 4 characters long');
                  return;
                }

                const keyboards_folder = await GetHandleKeyboardsFolder(handle, Group, Individual);

                let keyboard_exists = false;

                const entries = await keyboards_folder.values();
                for await (const entry of entries) {
                  if (entry.name === `${new_keyset_name}.json`) {
                    keyboard_exists = true;
                    break;
                  }
                }

                if (keyboard_exists) {
                  window.alert('Keyset already exists');
                  return;
                }

                const key_set = createNewKeySet(new_keyset_name);

                const key_board = await keyboards_folder.getFileHandle(`${new_keyset_name}.json`, { create: true });

                const writer = await key_board.createWritable();
                await writer.write(serializeKeySet(key_set));
                await writer.close();

                const new_state = {
                  ...keysets,
                  KeySets: [...keysets.KeySets, key_set],
                };

                setKeysets(new_state);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Keyset
            </Button>
          </ToolTipWrapper>
        </CardHeader>

        <CardContent className="flex flex-col gap-1.5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyset</TableHead>
                <TableHead>Frequency Keys</TableHead>
                <TableHead>Duration Keys</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Date Modified</TableHead>
                <TableHead className="flex flex-row justify-end">Manage Keyset</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keysets.KeySets.map((keys, index) => (
                <TableRow key={index} className="my-2">
                  <TableCell>{keys.Name}</TableCell>
                  <TableCell>{keys.FrequencyKeys.length}</TableCell>
                  <TableCell>{keys.DurationKeys.length}</TableCell>
                  <TableCell>{keys.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell>{keys.lastModified.toLocaleDateString()}</TableCell>
                  <TableCell className="flex flex-row justify-end">
                    <Link to={`/session/${Group}/${Individual}/keysets/${keys.Name}`}>
                      <Button size={'sm'} variant={'outline'}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit KeySet
                      </Button>
                    </Link>
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
