import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Spreadsheet from 'react-spreadsheet';
import { prepareDurationReliTable, prepareFrequencyReliTable } from '@/lib/reli';
import BackButton from '@/components/ui/back-button';
import { ReliabilityPairType } from '@/types/reli';
import { KeySet } from '@/types/keyset';

type Props = {
  Group: string;
  Individual: string;
  Paired: ReliabilityPairType[];
  Keyset: KeySet;
};

export default function ReliabilityViewerContent({ Paired, Keyset }: Props) {
  const frequencyData = prepareFrequencyReliTable(Paired, Keyset);
  const durationData = prepareDurationReliTable(Paired, Keyset);

  return (
    <div className="flex flex-col w-full gap-4">
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex flex-col gap-1.5 grow">
            <CardTitle>Reliability Estimates: Frequency</CardTitle>
            <CardDescription>Estimates of various indices are presented below in 10s bins</CardDescription>
          </div>
          <BackButton />
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Spreadsheet
            data={frequencyData.rows}
            columnLabels={frequencyData.headings}
            onKeyDown={(ev) => {
              if (ev.key.toLocaleLowerCase() === 'v') ev.preventDefault();
            }}
          />
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex flex-col gap-1.5 grow">
            <CardTitle>Reliability Estimates: Duration</CardTitle>
            <CardDescription>Estimates of various indices are presented below in 10s bins</CardDescription>
          </div>
          <BackButton />
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Spreadsheet
            data={durationData.rows}
            columnLabels={durationData.headings}
            onKeyDown={(ev) => {
              if (ev.key.toLocaleLowerCase() === 'v') ev.preventDefault();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
