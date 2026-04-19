import ReliabilityViewerContent from './views/reli-viewer-content';
import { ReliabilityPairType } from '@/types/reli';
import { KeySet } from '@/types/keyset';
import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const UNFILTERED_STRING = 'Unfiltered';

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
  const primaryRaters = Array.from(new Set(PairedSession.map((pair) => pair.primary.SessionSettings.Initials)));
  const reliRaters = Array.from(new Set(PairedSession.map((pair) => pair.reli.SessionSettings.Initials)));

  const [primaryRater, setPrimaryRater] = useState<string | null>(null);
  const [reliRater, setReliRater] = useState<string | null>(null);

  const memoizedRaterArray = useMemo(() => {
    let filtered = PairedSession;

    if (primaryRater && primaryRater !== UNFILTERED_STRING) {
      filtered = filtered.filter((pair) => pair.primary.SessionSettings.Initials === primaryRater);
    }

    if (reliRater && reliRater !== UNFILTERED_STRING) {
      filtered = filtered.filter((pair) => pair.reli.SessionSettings.Initials === reliRater);
    }

    return filtered;
  }, [primaryRater, reliRater, PairedSession]);

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="w-full flex flex-row justify-between">
        <div className="flex flex-row items-center gap-2 w-fit">
          <p>Filter Primary Coder:</p>
          <Select onValueChange={(value) => setPrimaryRater(value)} defaultValue={primaryRater || UNFILTERED_STRING}>
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="Filter Primary Data Coder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key={UNFILTERED_STRING} value={UNFILTERED_STRING}>
                {UNFILTERED_STRING}
              </SelectItem>
              {primaryRaters.map((rater) => (
                <SelectItem key={rater} value={rater}>
                  {rater}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-row items-center gap-2 w-fit">
          <p>Filter Reliability Coder:</p>
          <Select onValueChange={(value) => setReliRater(value)} defaultValue={reliRater || UNFILTERED_STRING}>
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="Filter Reliability Coder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key={UNFILTERED_STRING} value={UNFILTERED_STRING}>
                {UNFILTERED_STRING}
              </SelectItem>
              {reliRaters.map((rater) => (
                <SelectItem key={rater} value={rater}>
                  {rater}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ReliabilityViewerContent Group={Group} Individual={Individual} Paired={memoizedRaterArray} Keyset={Keyset} />
    </div>
  );
}
