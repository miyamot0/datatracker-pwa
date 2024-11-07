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
import useQueryKeyboards from '@/hooks/keyboards/useQueryKeyboards';
import createHref from '@/lib/links';
import { Edit2, ImportIcon, Plus } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function KeySetsPage() {
  const { Group, Individual } = useParams();
  const { data, status, error, handle, addKeyboard } = useQueryKeyboards(Group, Individual);

  const navigate = useNavigate();

  if (!handle || !Group || !Individual) {
    navigate(createHref({ type: 'Dashboard' }), {
      unstable_viewTransition: true,
    });

    return <></>;
  }

  if (status === 'loading') {
    return <LoadingDisplay />;
  }

  if (error) {
    return <div>{error}</div>;
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
            <CardTitle>Keyset Directory: {Individual}</CardTitle>
            <CardDescription>Create or Edit Current Keysets</CardDescription>
          </div>
          <div className="flex flex-row gap-2">
            <ToolTipWrapper Label="Import an existing KeySet for this client">
              <Button variant={'outline'} className="shadow">
                <Link
                  to={`/session/${Group}/${Individual}/keysets/import`}
                  unstable_viewTransition
                  className="flex flex-row items-center"
                >
                  <ImportIcon className="mr-2 h-4 w-4" />
                  Import Keyset
                </Link>
              </Button>
            </ToolTipWrapper>

            <ToolTipWrapper Label="Create a new KeySet for individual">
              <Button
                variant={'outline'}
                className="shadow"
                onClick={async () => {
                  await addKeyboard();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Keyset
              </Button>
            </ToolTipWrapper>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-1.5">
          <p>
            This page lists various keysets that have been created for the client. Each keyset is a collection of keys
            that specify a key-behavior relationship. You must have at least <i>one</i> keyset to begin recording client
            data.
          </p>

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
              {data.map((keys, index) => (
                <TableRow key={index} className="my-2">
                  <TableCell>{keys.Name}</TableCell>
                  <TableCell>{keys.FrequencyKeys.length}</TableCell>
                  <TableCell>{keys.DurationKeys.length}</TableCell>
                  <TableCell>{keys.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell>{keys.lastModified.toLocaleDateString()}</TableCell>
                  <TableCell className="flex flex-row justify-end">
                    <Link unstable_viewTransition to={`/session/${Group}/${Individual}/keysets/${keys.Name}`}>
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
