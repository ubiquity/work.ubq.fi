import { OAuthToken } from "./get-github-access-token";
import { GitHubIssue } from "./github-types";

export function getLocalStore(key: string): (GitHubIssue | GitHubIssue)[] | OAuthToken | null {
  const cachedIssues = localStorage.getItem(key);
  if (cachedIssues) {
    try {
      return JSON.parse(cachedIssues);
    } catch (error) {
      console.error(error);
    }
  }
  return null;
}
