import PageWrapper from '@/components/elements/page-wrapper';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { CleanUpString } from '@/lib/strings';
import ResultsViewerContent from './views/results-viewer-content';
import { prepareDataOrganization } from '@/lib/summary';
import { ModifiedSessionResult } from '@/types/storage';
import { KeySet } from '@/types/keyset';
import { ToggleDisplayKey } from '@/types/visuals';

export default function ResultsViewerPage({
  Group,
  Individual,
  Evaluation,
  Sessions,
  LatestKeySet,
  ShowKeysFreq,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  Sessions: ModifiedSessionResult[];
  LatestKeySet: KeySet;
  ShowKeysFreq: ToggleDisplayKey[];
}) {
  const { UnfilteredKeysDuration, TimerMapping } = prepareDataOrganization(
    Group,
    Individual,
    Evaluation,
    LatestKeySet,
  );

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(CleanUpString(Group)),
        BuildEvaluationsBreadcrumb(CleanUpString(Group), CleanUpString(Individual)),
      ]}
      label={`View ${CleanUpString(CleanUpString(Evaluation))} Data`}
      className="select-none"
    >
      <ResultsViewerContent
        UnfilteredKeysDuration={UnfilteredKeysDuration}
        TimerMapping={TimerMapping}
        Results={Sessions}
        Keyset={LatestKeySet}
        ShowKeysFreq={ShowKeysFreq}
        Group={Group}
        Individual={Individual}
        Evaluation={Evaluation}
      />
    </PageWrapper>
  );
}
