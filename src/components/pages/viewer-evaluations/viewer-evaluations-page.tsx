import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingDisplay from '@/components/ui/loading-display';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import useQueryEvaluationsMeta from '@/hooks/evaluations/useQueryEvaluationsMeta';
import createHref from '@/lib/links';
import { useNavigate, useParams } from 'react-router-dom';

export default function ViewerEvaluationsPage() {
  const { Group, Individual } = useParams();

  const { data, status, error, handle } = useQueryEvaluationsMeta(Group, Individual);

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
            This page lists keysets that have been created for those <i>other than</i> the current client. Each keyset
            is a collection of keys that specify a key-behavior relationship.
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
            <TableBody></TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
