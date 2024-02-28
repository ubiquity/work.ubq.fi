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
  if ("tasks" in value && value.tasks.length && "isNew" in value.tasks[0] && "isModified" in value.tasks[0]) {
    const tasksWithoutState = value.tasks.map(({ preview, full }) => ({
      preview,
      full,
    }));
    localStorage[key] = JSON.stringify({
      ...value,
      tasks: tasksWithoutState,
    });
  } else {
    localStorage[key] = JSON.stringify(value);
  }
}
