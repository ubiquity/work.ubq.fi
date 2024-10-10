// this file contains functions to save and retrieve images from IndexedDB which is client-side in-browser storage
export async function saveImageToCache({
  dbName,
  storeName,
  keyName,
  orgName,
  avatarBlob,
}: {
  dbName: string;
  storeName: string;
  keyName: string;
  orgName: string;
  avatarBlob: Blob;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(dbName, 2); // Increase version number to ensure onupgradeneeded is called
    open.onupgradeneeded = function () {
      const db = open.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: keyName });
      }
    };
    open.onsuccess = function () {
      const db = open.result;
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const item = {
        name: `avatarUrl-${orgName}`,
        image: avatarBlob,
        created: new Date().getTime(),
      };
      store.put(item);
      transaction.oncomplete = function () {
        db.close();
        resolve();
      };
      transaction.onerror = function (event) {
        const errorEventTarget = event.target as IDBRequest;
        reject("Error saving image to DB: " + errorEventTarget.error?.message);
      };
    };
  });
}

export function getImageFromCache({ dbName, storeName, orgName }: { dbName: string; storeName: string; orgName: string }): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(dbName, 2); // Increase version number to ensure onupgradeneeded is called
    open.onupgradeneeded = function () {
      const db = open.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "name" });
      }
    };
    open.onsuccess = function () {
      const db = open.result;
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const getImage = store.get(`avatarUrl-${orgName}`);
      getImage.onsuccess = function () {
        resolve(getImage.result?.image || null);
      };
      transaction.oncomplete = function () {
        db.close();
      };
      transaction.onerror = function (event) {
        const errorEventTarget = event.target as IDBRequest;
        reject("Error retrieving image from DB: " + errorEventTarget.error?.message);
      };
    };
  });
}
