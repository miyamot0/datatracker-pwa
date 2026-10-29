import { lazy, Suspense, useState } from 'react';
import type { NameDialogProps } from './name-dialog';

const NameDialog = lazy(() => import('./name-dialog').then((m) => ({ default: m.NameDialog })));

export type NameDialogRequest = Omit<NameDialogProps, 'open' | 'onOpenChange'>;

/**
 * Opens a name dialog on demand. The dialog chunk is fetched the first time a request is made.
 * Render `nameDialog` once in the page; it is null while no dialog is open.
 */
export function useNameDialog() {
  const [request, setRequest] = useState<NameDialogRequest | null>(null);

  const nameDialog = request ? (
    <Suspense fallback={null}>
      <NameDialog
        {...request}
        open
        onOpenChange={() => setRequest(null)}
        onSubmit={(name) => {
          request.onSubmit(name);
          setRequest(null);
        }}
      />
    </Suspense>
  ) : null;

  return { openNameDialog: setRequest, nameDialog };
}
