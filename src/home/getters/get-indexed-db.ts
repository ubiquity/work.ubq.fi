import { GitHubIssue } from "../github-types";

// this file contains functions to save and retrieve issues/images from IndexedDB which is client-side in-browser storage
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

async function openIssuesDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("IssuesDB", 2);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("issues")) {
        db.createObjectStore("issues", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Saves fetched issues into IndexedDB
export async function saveIssuesToCache(issues: GitHubIssue[]): Promise<void> {
  const db = await openIssuesDB();
  const transaction = db.transaction("issues", "readwrite");
  const store = transaction.objectStore("issues");

  for (const issue of issues) {
    store.put(issue); // Add or update issue
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Retrieves issues from IndexedDB
export async function getIssuesFromCache(): Promise<GitHubIssue[]> {
  const db = await openIssuesDB();
  const transaction = db.transaction("issues", "readonly");
  const store = transaction.objectStore("issues");

  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}
