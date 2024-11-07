import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
  BuildKeysetBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingDisplay from '@/components/ui/loading-display';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import useQueryKeyboardsMeta from '@/hooks/keyboards/useQueryKeyboardsMeta';
import createHref from '@/lib/links';
import { ImportIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function ViewerKeysetPage() {
  const { Group, Individual } = useParams();
  const { data, status, error, handle, importExistingKeyset } = useQueryKeyboardsMeta(Group, Individual);

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
        <CardContent className="flex flex-col gap-1.5">
          <p>
            This page lists keysets that have been created for those <i>other than</i> the current client. Each keyset
            is a collection of keys that specify a key-behavior relationship.
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Individual</TableHead>
                <TableHead>Keyset Name</TableHead>
                <TableHead>Duration Keys</TableHead>
                <TableHead>Frequency Keys</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((keyset) => {
                const { Group: grp1, Individual: ind1, ...rest } = keyset;

                const string_duration_keys = keyset.DurationKeys.map((key) => {
                  return `${key.KeyDescription} (${key.KeyName.toUpperCase()})`;
                }).join(', ');

                const string_frequency_keys = keyset.FrequencyKeys.map((key) => {
                  return `${key.KeyDescription} (${key.KeyName.toUpperCase()})`;
                }).join(', ');

                return (
                  <TableRow key={keyset.id}>
                    <TableCell>{grp1}</TableCell>
                    <TableCell>{ind1}</TableCell>
                    <TableCell>{keyset.Name}</TableCell>
                    <TableCell>{string_duration_keys}</TableCell>
                    <TableCell>{string_frequency_keys}</TableCell>
                    <TableCell>
                      <Button
                        variant={'outline'}
                        className="w-full"
                        onClick={async () => {
                          await importExistingKeyset(rest);
                        }}
                      >
                        <ImportIcon className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
