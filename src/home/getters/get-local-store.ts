import { TaskMaybeFull, TaskNoState } from "../fetch-github/preview-to-full-mapping";
import { OAuthToken } from "./get-github-access-token";

export function getLocalStore(key: string): TaskNoState[] | OAuthToken | null {
  const cachedIssues = localStorage.getItem(key);
  if (cachedIssues) {
    try {
      const value = JSON.parse(cachedIssues);

      // if (key === "gitHubTasks") {
      //   return value.map((preview: GitHubIssue, full: null | GitHubIssue) => ({
      //     isNew: false,
      //     isModified: false,
      //     preview,
      //     full,
      //   })) as TaskMaybeFull[];
      // }

      return value; // as OAuthToken;
    } catch (error) {
      console.error(error);
    }
  }
  return null;
}

export function setLocalStore(key: string, value: TaskMaybeFull[] | OAuthToken) {
  // remove state from issues before saving to local storage
  if (Array.isArray(value) && value.length && "isNew" in value[0] && "isModified" in value[0]) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const tasksWithoutState = value.map(({ isNew, isModified, preview, full }) => ({
      preview,
      full,
    }));
    localStorage[key] = JSON.stringify(tasksWithoutState);
  } else {
    localStorage[key] = JSON.stringify(value);
  }
}
