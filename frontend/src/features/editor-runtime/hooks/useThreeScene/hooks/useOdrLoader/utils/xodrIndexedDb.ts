import { CACHE_KEY } from '../../../constants/openDriveConstants';

const DATABASE_NAME = 'scenario-manager-xodr-cache';
const STORE_NAME = 'xodr';
const DATABASE_VERSION = 1;

function openXodrCacheDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readXodrFromIndexedDb(): Promise<string | null> {
  try {
    const database = await openXodrCacheDb();
    return await new Promise<string | null>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(CACHE_KEY);
      request.onsuccess = () =>
        resolve((request.result as string | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to read cached OpenDRIVE map from IndexedDB.', error);
    return null;
  }
}

export async function writeXodrToIndexedDb(content: string): Promise<void> {
  try {
    const database = await openXodrCacheDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(content, CACHE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.warn('Failed to persist cached OpenDRIVE map to IndexedDB.', error);
  }
}
