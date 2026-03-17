import PageWrapper from '@/components/elements/page-wrapper';
import BackButton from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { checkCrossOriginIsolation } from '@/lib/shared-buffer';
import { cn } from '@/lib/utils';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/diagnostics')({
  component: RouteComponent,
});

function AdaptiveBadge({ isSupported }: { isSupported: boolean }) {
  return (
    <Badge
      className={cn('bg-green-500 text-white hover:bg-green-500 cursor-default select-none whitespace-nowrap', {
        'bg-red-500 hover:bg-red-500': !isSupported,
      })}
    >
      {isSupported ? 'Enabled' : 'Disabled'}
    </Badge>
  );
}

function RouteComponent() {
  const check = checkCrossOriginIsolation();

  return (
    <PageWrapper label="Diagnostics" className="flex flex-col gap-6 select-none">
      <Card className="w-full max-w-screen-lg">
        <CardHeader className="flex flex-row justify-between align-top">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Diagnostic and Performance Information</CardTitle>
            <CardDescription>Information here presented for debugging purposes</CardDescription>
          </div>
          <BackButton />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-row justify-between">
            <p>Shared Array Buffer support:</p> <AdaptiveBadge isSupported={check.isSupported} />
          </div>
          <div className="flex flex-row justify-between">
            <p>Cross-Origin Isolation:</p> <AdaptiveBadge isSupported={check.isIsolated} />
          </div>

          <Separator className="my-1" />

          <div className="flex flex-row justify-between">
            <p>User Agent:</p> <span>{check.userAgent}</span>
          </div>

          <Separator className="my-1" />

          <div className="flex flex-row justify-between">
            <p>Issues:</p> <span>{check.issues.length}</span>
          </div>
          {check.issues.length > 0 && (
            <>
              <ul className="list-disc list-inside">
                {check.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </>
          )}

          <div className="flex flex-row justify-between">
            <p>Recommendations:</p> <span>{check.recommendations.length}</span>
          </div>
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
