import { saveIssuesToCache } from "../getters/get-indexed-db";
import { GitHubIssue } from "../github-types";
import { taskManager } from "../home";
import { displayGitHubIssues } from "./fetch-and-display-previews";

// Fetches issues from the `partner-open-issues.json` artifact on the `__STORAGE__` branch
// https://github.com/devpool-directory/devpool-directory/blob/__STORAGE__/README_STORAGE.md

type StorageIssue = {
  owner: string;
  repo: string;
  number: number;
  node_id: string;
  title: string;
  url: string; // html url
  body?: string;
  labels: Array<string>;
  assignees?: Array<unknown>;
  state: string;
  created_at: string;
  updated_at: string;
};

// partner-open-proposals.json has the same item shape as partner-open-issues.json

function hashStringToNumber(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  // Ensure positive 32-bit integer
  return hash >>> 0;
}

function mapStorageIssueToGitHubIssue(issue: StorageIssue): GitHubIssue {
  const repositoryUrl = `https://github.com/${issue.owner}/${issue.repo}`;
  const id = hashStringToNumber(issue.node_id);
  const hasAssignees = Array.isArray(issue.assignees) && issue.assignees.length > 0;
  return {
    id,
    node_id: issue.node_id,
    number: issue.number,
    title: issue.title,
    body: issue.body || "",
    labels: issue.labels,
    repository_url: repositoryUrl,
    html_url: issue.url,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    assignee: hasAssignees ? { id: 0, login: "assigned" } : null,
    assignees: Array.isArray(issue.assignees) ? issue.assignees : [],
  };
}

export async function fetchIssues(): Promise<GitHubIssue[]> {
  const base = "https://raw.githubusercontent.com/devpool-directory/devpool-directory/__STORAGE__";

  // Fetch priced open issues (directory)
  const pricedRes = await fetch(`${base}/partner-open-issues.json`);
  const pricedJson: StorageIssue[] = await pricedRes.json();
  const priced = pricedJson.map(mapStorageIssueToGitHubIssue);

  // Fetch unpriced open issues (proposals)
  const proposalsRes = await fetch(`${base}/partner-open-proposals.json`);
  const proposalsJson: StorageIssue[] = await proposalsRes.json();
  const proposals = proposalsJson.map(mapStorageIssueToGitHubIssue);

  // Merge; datasets are disjoint by design (priced vs unpriced)
  return [...priced, ...proposals];
}

// First issues are rendered from cache then this function is called to update if needed
export async function postLoadUpdateIssues() {
  try {
    const cachedIssues = taskManager.getTasks();
    const fetchedIssues = await fetchIssues();

    if (issuesAreDifferent(cachedIssues, fetchedIssues)) {
      await saveIssuesToCache(cachedIssues, fetchedIssues); // this handles stale and new issues
      await taskManager.syncTasks();
      if (cachedIssues.length === 0) {
        void displayGitHubIssues(); // if it's first time loading keep animation
      } else {
        void displayGitHubIssues({ skipAnimation: true }); // if there were cached issues skip animation
      }
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
