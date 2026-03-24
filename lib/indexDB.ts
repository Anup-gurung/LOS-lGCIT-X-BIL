// lib/indexedDB.ts

const DB_NAME = "LoanAppDB";
const DB_VERSION = 1;
const STORE_NAME = "files";
const SESSION_STORE = "ndi_sessions";

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
      const DB_VERSION = 2; // 🔥 bump version (IMPORTANT)
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }

        
      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        const store = db.createObjectStore(SESSION_STORE, { keyPath: "id" });

        store.createIndex("role", "role", { unique: false });
        store.createIndex("refId", "refId", { unique: false });

      } else {
        // 🔥 handles existing DB upgrades
        const store = request.transaction?.objectStore(SESSION_STORE);

        if (store && !store.indexNames.contains("cid")) {
          store.createIndex("cid", "data.cid", { unique: false });
        }
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

// For NDI user data storage and retrieval
export const storeNDIScan = async (
  role: string,
  refId: string,
  NDIuserData: any
) => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, "readwrite");
    const store = tx.objectStore(SESSION_STORE);

    // 🔍 Get all records to calculate the latest scanCount
    const allReq = store.getAll();

    allReq.onsuccess = () => {
      const allRecords = allReq.result;
      const latestScanCount = allRecords.length
        ? Math.max(...allRecords.map((r: any) => r.scanCount || 0))
        : 0;

      // Create new record
      const record = {
        id: crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
        role,
        refId,
        data: NDIuserData,
        scanCount: latestScanCount + 1, // 🔥 Increment from previous max
        timestamp: Date.now(),
      };

      const putReq = store.put(record);

      putReq.onsuccess = () => {
        console.log("NDI scan saved with cumulative scanCount:", record.scanCount);
        resolve(record);
      };

      putReq.onerror = () => {
        console.error("NDI save failed:", putReq.error);
        reject(putReq.error);
      };
    };

    allReq.onerror = () => {
      console.error("Error reading all records:", allReq.error);
      reject(allReq.error);
    };
  });
};

export const getNDIDataByRef = async (refId: string): Promise<any> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, "readonly");
    const store = tx.objectStore(SESSION_STORE);
    const index = store.index("refId");

    const request = index.getAll(refId);

    request.onsuccess = () => {
      const results = request.result;
      resolve(results.length ? results[results.length - 1].data : null);
    };

    request.onerror = () => reject(request.error);
  });
};

export const getScanCount = async (): Promise<number> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, "readonly");
    const store = tx.objectStore(SESSION_STORE);

    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};


export const getScanCountByRole = async (role: string): Promise<number> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, "readonly");
    const store = tx.objectStore(SESSION_STORE);
    const index = store.index("role");

    const request = index.getAll(role);

    request.onsuccess = () => resolve(request.result.length);
    request.onerror = () => reject(request.error);
  });
};

export const clearSession = async () => {
  const db = await openDB();
  const tx = db.transaction(SESSION_STORE, "readwrite");
  tx.objectStore(SESSION_STORE).clear();
};

// export const clearNDIUsers = async (): Promise<void> => {
//   const db = await openDB();

//   return new Promise((resolve, reject) => {
//     const transaction = db.transaction(USER_STORE, "readwrite");
//     const store = transaction.objectStore(USER_STORE);

//     const request = store.clear();

//     request.onsuccess = () => resolve();
//     request.onerror = () => reject(request.error);
//   });
// };
export const resetNDIScanCount = async (): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, "readwrite");
    const store = tx.objectStore(SESSION_STORE);

    const request = store.getAll();

    request.onsuccess = () => {
      const records = request.result;

      records.forEach((rec: any) => {
        rec.scanCount = 0; // reset scan count
        store.put(rec); // update record
      });

      resolve();
    };

    request.onerror = () => reject(request.error);
  });
};

export const getGlobalScanCount = async (): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, "readonly");
    const store = tx.objectStore(SESSION_STORE);

    const request = store.get("globalScanCount");

    request.onsuccess = () => resolve(request.result?.count || 0);
    request.onerror = () => reject(request.error);
  });
};

export const incrementGlobalScanCount = async (): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, "readwrite");
    const store = tx.objectStore(SESSION_STORE);

    const request = store.get("globalScanCount");

    request.onsuccess = () => {
      const current = request.result?.count || 0;
      const newCount = current + 1;

      store.put({ id: "globalScanCount", count: newCount });

      resolve(newCount);
    };

    request.onerror = () => reject(request.error);
  });
};