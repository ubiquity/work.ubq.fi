import { TaskStorageItems, NotificationStorageItems } from "../github-types";
import { renderErrorInModal } from "../rendering/display-popup-modal";
import { OAuthToken } from "./get-github-access-token";

export function getLocalStore<T extends TaskStorageItems | NotificationStorageItems | OAuthToken>(key: string): T | null {
  const cachedData = localStorage.getItem(key);
  if (cachedData) {
    try {
      const value = JSON.parse(cachedData) as T;
      return value;
    } catch (error) {
      renderErrorInModal(error as Error, "Failed to parse cached data from local storage");
    }
  }
  return null;
}

export function setLocalStore<T extends TaskStorageItems | NotificationStorageItems | OAuthToken>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}
