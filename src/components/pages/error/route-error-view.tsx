import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { isDevelopment } from '@/lib/env';
import {
  ROUTE_ERROR_PATH,
  RouteErrorPayload,
  buildRouteErrorPayload,
  resolveReturnPath,
  toRouteErrorSearch,
} from '@/lib/route-error';

export function RouteErrorView({ payload }: { payload: RouteErrorPayload }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const returnPath = resolveReturnPath(payload);

  const handleReturn = () => {
    navigate({ href: returnPath });
  };

  const handleCopy = async () => {
    const details = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 select-text">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-red-500 text-lg text-center max-w-xl">{payload.message}</p>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm max-w-xl w-full">
        {payload.code && (
          <>
            <dt className="font-medium">Code</dt>
            <dd>{payload.code}</dd>
          </>
        )}
        <dt className="font-medium">Page</dt>
        <dd className="break-all">{payload.source}</dd>
        {payload.occurredAt && (
          <>
            <dt className="font-medium">Time</dt>
            <dd>{payload.occurredAt}</dd>
          </>
        )}
      </dl>

      {isDevelopment && payload.stack && (
        <pre className="text-xs whitespace-pre-wrap break-all max-w-3xl w-full max-h-64 overflow-auto p-3 rounded bg-muted">
          {payload.stack}
        </pre>
      )}

      <div className="flex gap-2">
        <Button onClick={handleReturn}>Return</Button>
        <Button variant="outline" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy details'}
        </Button>
      </div>
    </div>
  );
}

/**
 * Redirects to the error route from render-time checks, where a thrown redirect is not an option.
 * Navigation happens in an effect, so this renders nothing.
 */
export function RouteErrorRedirect({
  message,
  code,
  returnTo,
}: {
  message: string;
  code?: string;
  returnTo?: string;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const payload = buildRouteErrorPayload({ message, code, returnTo });
    navigate({ to: ROUTE_ERROR_PATH, search: toRouteErrorSearch(payload), replace: true });
  }, [message, code, returnTo, navigate]);

  return null;
}
