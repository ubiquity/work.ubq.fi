import { GitHubIssue } from "../github-types";

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
// Saves fetched issues into IndexedDB and removes stale issues
export async function saveIssuesToCache(cachedIssues: GitHubIssue[], fetchedIssues: GitHubIssue[]): Promise<void> {
  const db = await openIssuesDB();
  const transaction = db.transaction("issues", "readwrite");
  const store = transaction.objectStore("issues");

  // Identify and remove stale issues (in cache but not in fetched list)
  const staleIssues = cachedIssues.filter((cachedIssue) => !fetchedIssues.some((issue) => issue.id === cachedIssue.id));
  for (const issue of staleIssues) {
    store.delete(issue.id);
  }

  // Save or update fetched issues
  for (const issue of fetchedIssues) {
    store.put(issue);
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject((event.target as IDBTransaction).error);
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
