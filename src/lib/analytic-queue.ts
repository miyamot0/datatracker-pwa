import { openDB } from 'idb';

const DB_NAME = 'analytics-db';
const STORE_NAME = 'events';

export async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { autoIncrement: true });
    },
  });
}

export async function queueEvent(event: any) {
  const db = await getDb();
  await db.add(STORE_NAME, event);
}

export async function getQueuedEvents() {
  const db = await getDb();
  return db.getAll(STORE_NAME);
}

export async function clearEvents() {
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).clear();
  await tx.done;
}
