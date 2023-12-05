import { AvatarCache, GitHubIssue } from "../github-types";
import { OAuthToken } from "./get-github-access-token";

export function getLocalStore(key: string): (GitHubIssue | GitHubIssue)[] | OAuthToken | AvatarCache | null {
  const cachedIssues = localStorage.getItem(key);
  if (cachedIssues) {
    try {
      const value = JSON.parse(cachedIssues);
      return value;
    } catch (error) {
      console.error(error);
    }
  }
  return null;
}
