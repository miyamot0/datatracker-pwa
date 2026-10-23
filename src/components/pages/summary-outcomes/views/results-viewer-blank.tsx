import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResultsViewerBlank() {
  return (
    <div className="flex flex-col w-full gap-4">
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex flex-col gap-1.5 grow">
            <CardTitle>Results Viewer</CardTitle>
            <CardDescription>No Data Yet</CardDescription>
          </div>
          <BackButton />
        </CardHeader>

        <CardContent>No session data is currently available to view.</CardContent>
      </Card>
    </div>
  );
}
