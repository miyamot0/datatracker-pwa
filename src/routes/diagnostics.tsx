import PageWrapper from '@/components/layout/page-wrapper';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { checkCrossOriginIsolation } from '@/lib/shared-buffer';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/diagnostics')({
  component: RouteComponent,
});

function RouteComponent() {
  const check = checkCrossOriginIsolation();

  return (
    <PageWrapper className="flex flex-col gap-6 select-none">
      <Card className="w-full max-w-screen-lg">
        <CardHeader className="flex flex-row justify-between align-top">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Diagnostic and Performance Information</CardTitle>
            <CardDescription>Information here presented for debugging purposes</CardDescription>
          </div>
          <BackButton />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>Shared Array Buffer support: {check.isSupported ? 'Available' : 'Unavailable'}</div>
          <div>Cross-Origin Isolation: {check.isIsolated ? 'Enabled' : 'Disabled'}</div>
          <div>User Agent: {check.userAgent}</div>

          <div>Issues: {check.issues.length}</div>
          {check.issues.length > 0 && (
            <>
              <ul className="list-disc list-inside">
                {check.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </>
          )}

          <div>Recommendations: {check.recommendations.length}</div>
          {check.recommendations.length > 0 && (
            <>
              <ul className="list-disc list-inside">
                {check.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
