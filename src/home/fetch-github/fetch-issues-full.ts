import { saveIssuesToCache } from "../getters/get-indexed-db";
import { GitHubIssue } from "../github-types";
import { taskManager } from "../home";
import { displayGitHubIssues } from "./fetch-and-display-previews";
export const organizationImageCache = new Map<string, Blob | null>(); // this should be declared in image related script

// Fetches the issues from `devpool-issues.json` file in the `__STORAGE__` branch of the `devpool-directory` repo
// https://github.com/ubiquity/devpool-directory/blob/__STORAGE__/devpool-issues.json

export async function fetchIssues(): Promise<GitHubIssue[]> {
  const response = await fetch("https://raw.githubusercontent.com/ubiquity/devpool-directory/__STORAGE__/devpool-issues.json");
  const jsonData = await response.json();
  return jsonData;
}

// First issues are rendered from cache then this function is called to update if needed
export async function postLoadUpdateIssues() {
  try {
    const cachedIssues = taskManager.getTasks();
    const fetchedIssues = await fetchIssues();

    if (issuesAreDifferent(cachedIssues, fetchedIssues)) {
      await saveIssuesToCache(cachedIssues, fetchedIssues);
      await taskManager.syncTasks();
      void displayGitHubIssues();
    }
  } catch (error) {
    console.error("Error updating issues cache", error);
  }
}

// Sort issues by ID
function sortIssues(issues: GitHubIssue[]): GitHubIssue[] {
  return issues.slice().sort((a, b) => a.id - b.id);
}

// Check if issues are different
function issuesAreDifferent(cached: GitHubIssue[], fetched: GitHubIssue[]): boolean {
  cached = sortIssues(cached);
  fetched = sortIssues(fetched);

  if (cached.length !== fetched.length) return true;

  for (let i = 0; i < cached.length; i++) {
    if (cached[i].id !== fetched[i].id) {
      return true;
    }
  }
  return false;
}
