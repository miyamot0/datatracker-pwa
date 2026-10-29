import { lazy, Suspense, useState } from 'react';
import type { ConfirmDialogProps } from './confirm-dialog';

const ConfirmDialog = lazy(() => import('./confirm-dialog').then((m) => ({ default: m.ConfirmDialog })));

export type ConfirmDialogRequest = Omit<ConfirmDialogProps, 'open' | 'onOpenChange'>;

/**
 * Opens a confirm dialog on demand. The dialog chunk is fetched the first time a request is made.
 * Render `confirmDialog` once in the page; it is null while no dialog is open.
 */
export function useConfirmDialog() {
  const [request, setRequest] = useState<ConfirmDialogRequest | null>(null);

  const confirmDialog = request ? (
    <Suspense fallback={null}>
      <ConfirmDialog
        {...request}
        open
        onOpenChange={() => setRequest(null)}
      />
    </Suspense>
  ) : null;

  return { openConfirmDialog: setRequest, confirmDialog };
}
