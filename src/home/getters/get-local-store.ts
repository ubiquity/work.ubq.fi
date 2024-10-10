import { TaskStorageItems } from "../github-types";
import { renderErrorInModal } from "../rendering/display-popup-modal";
import { OAuthToken } from "./get-github-access-token";

// storage is key-based an can either store tasks, OAuth token or be empty
export function getLocalStore(key: string): TaskStorageItems | OAuthToken | null {
  const cachedIssues = localStorage.getItem(key);
  if (cachedIssues) {
    try {
      const value = JSON.parse(cachedIssues);

      return value; // as OAuthToken;
    } catch (error) {
      renderErrorInModal(error as Error, "Failed to parse cached issues from local storage");
    }
  }
  return null;
}

export function setLocalStore(key: string, value: TaskStorageItems | OAuthToken) {
  // remove state from issues before saving to local storage
  localStorage[key] = JSON.stringify(value);
}
