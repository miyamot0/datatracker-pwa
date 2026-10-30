import { useState } from 'react';

/**
 * Open state for a dialog that can be opened by its own trigger or controlled by a parent (e.g. a menu item).
 *
 * @param open - Controlled open state. Leave undefined to manage state internally.
 * @param onOpenChange - Notified whenever the dialog requests a change, in either mode.
 */
export function useDialogOpenState(
  open: boolean | undefined,
  onOpenChange: ((open: boolean) => void) | undefined,
): [boolean, (next: boolean) => void] {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next);
    }

    onOpenChange?.(next);
  };

  return [isControlled ? open : internalOpen, setOpen];
}
