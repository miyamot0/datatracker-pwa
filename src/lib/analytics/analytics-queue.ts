import type { EventPayload } from '@/types/analytics';

const DB_NAME = 'analytics-db';
const STORE_NAME = 'events';

let dbPromise: Promise<IDBDatabase> | undefined;

/**
 * Lazily opens (and caches) the database used for simple error tracking (esp. if offline)
 */
function getDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch((error) => {
    dbPromise = undefined;
    throw error;
  });

  return dbPromise;
}

/**
 * Runs a single request in its own transaction, resolving once the transaction has committed
 */
async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await getDb();

  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const request = run(tx.objectStore(STORE_NAME));

    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error ?? request.error);
    tx.onabort = () => reject(tx.error);
  });
}

/**
 * Store log if unable to send presently
 *
 * @param {EventPayload} event The event payload to be queued
 */
export async function queueEvent(event: EventPayload) {
  await withStore('readwrite', (store) => store.add(event));
}

/**
 * Get all queued events
 *
 * @return {Promise<EventPayload[]>} A promise that resolves to an array of queued event payloads
 */
export async function getQueuedEvents(): Promise<EventPayload[]> {
  return withStore('readonly', (store) => store.getAll() as IDBRequest<EventPayload[]>);
}

/**
 * Clear all queued events after successful send
 */
export async function clearQueuedEvents() {
  await withStore('readwrite', (store) => store.clear());
}

/**
 * Delete all events from the database
 */
export async function deleteAllEvents() {
  await withStore('readwrite', (store) => store.clear());
}
