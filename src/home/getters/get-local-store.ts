import { TaskStorageItems } from "../github-types";
import { OAuthToken } from "./get-github-access-token";

export function getLocalStore(key: string): TaskStorageItems | OAuthToken | null {
  const cachedIssues = localStorage.getItem(key);
  if (cachedIssues) {
    try {
      const value = JSON.parse(cachedIssues);

      return value; // as OAuthToken;
    } catch (error) {
      console.error(error);
    }
  }
  return null;
}

export function setLocalStore(key: string, value: TaskStorageItems | OAuthToken) {
  // remove state from issues before saving to local storage
  localStorage[key] = JSON.stringify(value);
}
