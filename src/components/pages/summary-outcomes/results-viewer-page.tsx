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
  ShowKeysDuration,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  Sessions: ModifiedSessionResult[];
  LatestKeySet: KeySet;
  ShowKeysFreq: ToggleDisplayKey[];
  ShowKeysDuration: ToggleDisplayKey[];
}) {
  const { TimerMapping } = prepareDataOrganization(Group, Individual, Evaluation, LatestKeySet);

  return (
    <ResultsViewerContent
      TimerMapping={TimerMapping}
      Results={Sessions}
      Keyset={LatestKeySet}
      ShowKeysFreq={ShowKeysFreq}
      ShowKeysDuration={ShowKeysDuration}
      Group={Group}
      Individual={Individual}
      Evaluation={Evaluation}
    />
  );
}
