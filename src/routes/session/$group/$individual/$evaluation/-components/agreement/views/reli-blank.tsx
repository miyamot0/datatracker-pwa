import PageWrapper from '@/components/layout/page-wrapper';
import BackButton from '@/components/ui/back-button';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';

type Props = {
  Group: string;
  Individual: string;
  Evaluation: string;
};

export default function ReliabilityBlank({ Group, Individual, Evaluation }: Props) {
  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
      ]}
      label={`Reliability for ${CleanUpString(Evaluation)}`}
    >
      <div className="flex flex-col w-full gap-4">
        <Card className="w-full">
          <CardHeader className="flex flex-row justify-between">
            <div className="flex flex-col gap-1.5 grow">
              <CardTitle>Reliability Viewer</CardTitle>
              <CardDescription>Error in Calculating Reliability</CardDescription>
            </div>
            <BackButton
              Label="Back to Evaluations"
              Href={createHref({ type: 'Evaluations', group: Group, individual: Individual })}
            />
          </CardHeader>

          <CardContent>No data files are currently available to inspect.</CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
