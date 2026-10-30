import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { prepareDurationReliTable, prepareFrequencyReliTable } from '@/lib/reli';
import BackButton from '@/components/ui/back-button';
import { ReliabilityPairType } from '@/types/reli';
import { KeySet } from '@/types/keyset/core';

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
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex flex-col gap-1.5 grow">
            <CardTitle>Reliability Estimates: Frequency</CardTitle>
            <CardDescription>Estimates of various indices are presented below in 10s bins</CardDescription>
          </div>
          <BackButton />
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <DataTable
            headings={frequencyData.headings}
            rows={frequencyData.rows.map((row) => row.map((cell) => cell.value))}
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
          <DataTable
            headings={durationData.headings}
            rows={durationData.rows.map((row) => row.map((cell) => cell.value))}
          />
        </CardContent>
      </Card>
    </>
  );
}
