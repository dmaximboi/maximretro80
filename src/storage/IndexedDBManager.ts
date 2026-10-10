const DB_NAME = "maxi-retro-80";
const DB_VERSION = 1;

export const STORES = {
  settings: "settings",
  history: "history",
  favourites: "favourites",
  roms: "roms",
  saves: "saves",
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("IndexedDB open timed out.")), 4000);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings);
      }
      if (!db.objectStoreNames.contains(STORES.history)) {
        db.createObjectStore(STORES.history, { keyPath: "gameId" });
      }
      if (!db.objectStoreNames.contains(STORES.favourites)) {
        db.createObjectStore(STORES.favourites, { keyPath: "gameId" });
      }
      if (!db.objectStoreNames.contains(STORES.roms)) {
        db.createObjectStore(STORES.roms, { keyPath: "gameId" });
      }
      if (!db.objectStoreNames.contains(STORES.saves)) {
        db.createObjectStore(STORES.saves, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      window.clearTimeout(timer);
      resolve(request.result);
    };
    request.onerror = () => {
      window.clearTimeout(timer);
      reject(request.error ?? new Error("IndexedDB open failed."));
    };
  });
}

async function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = work(store);
    tx.oncomplete = () => {
      db.close();
      if (request) resolve(request.result);
      else resolve(undefined as T);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("IndexedDB transaction failed."));
    };
    if (request) {
      request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
    }
  });
}

export const db = {
  get<T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
    return withStore(storeName, "readonly", (store) => store.get(key));
  },
  put<T>(storeName: StoreName, value: T, key?: IDBValidKey): Promise<IDBValidKey> {
    return withStore(storeName, "readwrite", (store) => (key !== undefined ? store.put(value, key) : store.put(value)));
  },
  delete(storeName: StoreName, key: IDBValidKey): Promise<undefined> {
    return withStore(storeName, "readwrite", (store) => store.delete(key));
  },
  getAll<T>(storeName: StoreName): Promise<T[]> {
    return withStore(storeName, "readonly", (store) => store.getAll());
  },
  clear(storeName: StoreName): Promise<undefined> {
    return withStore(storeName, "readwrite", (store) => store.clear());
  },
};
