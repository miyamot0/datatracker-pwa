import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReliabilityBlank() {
  return (
    <div className="flex flex-col w-full gap-4">
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex flex-col gap-1.5 grow">
            <CardTitle>Reliability Viewer</CardTitle>
            <CardDescription>Error in Calculating Reliability</CardDescription>
          </div>
          <BackButton />
        </CardHeader>

        <CardContent>No data files are currently available to inspect.</CardContent>
      </Card>
    </div>
  );
}
