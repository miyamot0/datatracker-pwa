import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingDisplay from '@/components/ui/loading-display';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import useQueryEvaluationsMeta from '@/hooks/evaluations/useQueryEvaluationsMeta';
import createHref from '@/lib/links';
import { ImportIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function ViewerEvaluationsPage() {
  const { Group, Individual } = useParams();

  const { data, status, error, handle, addEvaluationFolder } = useQueryEvaluationsMeta(Group, Individual);

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

  const current_evaluations = data
    .filter((record) => record.Individual === Individual)
    .map((record) => record.Evaluation);

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
      ]}
      label={'Evaluation Import'}
      className="select-none"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Evaluation Import</CardTitle>
          <CardDescription>Import an existing evaluation/conditions.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <p>
            This page lists Evaluations that have been created for those <i>other than</i> the current client. Each
            represents an Evaluation folder with various associated conditions.
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Individual</TableHead>
                <TableHead>Evalution</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data
                .filter(
                  (record) => record.Individual !== Individual && !current_evaluations.includes(record.Evaluation)
                )
                .map((record) => (
                  <TableRow key={record.Evaluation}>
                    <TableCell>{record.Group}</TableCell>
                    <TableCell>{record.Individual}</TableCell>
                    <TableCell>{record.Evaluation}</TableCell>
                    <TableCell>{record.Conditions.join(', ')}</TableCell>
                    <TableCell className="flex flex-row justify-end">
                      <Button
                        variant={'outline'}
                        onClick={async () => {
                          await addEvaluationFolder(record);
                        }}
                      >
                        <ImportIcon className="h-4 w-4 mr-2" />
                        Import Evaluation
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
