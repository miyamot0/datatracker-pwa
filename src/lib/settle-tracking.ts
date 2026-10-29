/**
 * React 19's `use()` only reads promises tagged with `status`/`value`. Tagging a promise when it settles lets
 * already-resolved (cached) loader data render without a suspense fallback flash.
 */
export function trackSettlement<T>(promise: Promise<T>): Promise<T> {
  const tracked = promise as Promise<T> & { status?: string; value?: T; reason?: unknown };

  tracked.then(
    (value) => {
      tracked.status = 'fulfilled';
      tracked.value = value;
    },
    (reason) => {
      tracked.status = 'rejected';
      tracked.reason = reason;
    },
  );

  return promise;
}
