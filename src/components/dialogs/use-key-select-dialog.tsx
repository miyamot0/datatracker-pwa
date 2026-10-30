import { lazy, Suspense, useState } from 'react';
import type { KeySelectDialogProps } from './key-select-dialog';

const KeySelectDialog = lazy(() =>
  import('./key-select-dialog').then((m) => ({ default: m.KeySelectDialog })),
);

export type KeySelectDialogRequest = Omit<KeySelectDialogProps, 'open' | 'onOpenChange'>;

/**
 * Opens a key selection dialog on demand. The dialog chunk is fetched the first time a request is made.
 * Render `keySelectDialog` once in the page; it is null while no dialog is open.
 */
export function useKeySelectDialog() {
  const [request, setRequest] = useState<KeySelectDialogRequest | null>(null);

  const keySelectDialog = request ? (
    <Suspense fallback={null}>
      <KeySelectDialog
        {...request}
        open
        onOpenChange={() => setRequest(null)}
        onSubmit={(keyName) => {
          request.onSubmit(keyName);
          setRequest(null);
        }}
      />
    </Suspense>
  ) : null;

  return { openKeySelectDialog: setRequest, keySelectDialog };
}
