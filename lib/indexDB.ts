// lib/indexedDB.ts

const DB_NAME = "LoanAppDB";
const DB_VERSION = 1;
const STORE_NAME = "files";

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

/**
 * Stores a file in IndexedDB and returns a unique ID.
 * @param file - The File object to store.
 * @param section - e.g., 'guarantor', 'security', 'relatedPep'
 * @param fieldName - e.g., 'passportPhoto'
 * @param index - index of the guarantor/security (for metadata)
 * @returns A promise that resolves to the file's ID (string).
 */
export const storeFile = async (
  file: File,
  section: string,
  fieldName: string,
  index: number,
): Promise<string> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const fileData = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      data: file, // store the File object directly; it's acceptable in IndexedDB
      section,
      fieldName,
      index,
      timestamp: Date.now(),
    };

    const request = store.add(fileData);
    request.onsuccess = () => resolve(fileData.id);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Deletes a file from IndexedDB by its ID.
 * @param id - The ID of the file to delete.
 */
export const deleteFile = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Retrieves a file by its ID (for later use, e.g., displaying or submitting).
 * @param id - The file ID.
 * @returns The stored object (including the File under `data`).
 */
export const getFile = async (id: string): Promise<any> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
