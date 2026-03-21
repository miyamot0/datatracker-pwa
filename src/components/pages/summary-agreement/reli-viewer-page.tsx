import ReliabilityViewerContent from './views/reli-viewer-content';
import { ReliabilityPairType } from '@/types/reli';
import { KeySet } from '@/types/keyset';

export default function ReliabilityViewerPage({
  Group,
  Individual,
  PairedSession,
  Keyset,
}: {
  Group: string;
  Individual: string;
  PairedSession: ReliabilityPairType[];
  Keyset: KeySet;
}) {
  return <ReliabilityViewerContent Group={Group} Individual={Individual} Paired={PairedSession} Keyset={Keyset} />;
}
