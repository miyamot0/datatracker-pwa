import { openDB } from 'idb';
import type { EventPayload } from '@/types/analytics';

const DB_NAME = 'analytics-db';
const STORE_NAME = 'events';

/**
 * Database for simple error tracking (esp. if offline)
 */
export const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { autoIncrement: true });
    }
  },
});

/**
 * Store log if unable to send presently
 *
 * @param {EventPayload} event The event payload to be queued
 */
export async function queueEvent(event: EventPayload) {
  const db = await dbPromise;
  await db.add(STORE_NAME, event);
}

/**
 * Get all queued events
 *
 * @return {Promise<EventPayload[]>} A promise that resolves to an array of queued event payloads
 */
export async function getQueuedEvents(): Promise<EventPayload[]> {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
}

/**
 * Clear all queued events after successful send
 */
export async function clearQueuedEvents() {
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).clear();
  await tx.done;
}

/**
 * Delete all events from the database
 */
export async function deleteAllEvents() {
  const db = await dbPromise;
  await db.clear(STORE_NAME);
}
