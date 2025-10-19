import { saveIssuesToCache } from "../getters/get-indexed-db.ts";
import { GitHubIssue } from "../github-types.ts";
import { taskManager } from "../home.ts";
import { displayGitHubIssues } from "./fetch-and-display-previews.ts";

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
  state: string;
  created_at: string;
  updated_at: string;
};

// partner-open-proposals.json has the same item shape as partner-open-issues.json

// Assignment source: mirror-state.json (subset used for UI)
// See: https://github.com/devpool-directory/devpool-directory/blob/__STORAGE__/README_STORAGE.md
type MirrorStateEntry = {
  assigned?: boolean;
  assignees?: unknown[];
  directory_issue_url?: string;
};

// Generate a stable 53-bit hash to minimize collisions for node_id
// Based on a dual-DJB2 accumulator producing up to 53 bits.
// The magic numbers 5381 and 52711 are used as initial values for the hash accumulators:
//   - 5381 is the traditional starting value for the DJB2 hash function, chosen by Daniel J. Bernstein for its good distribution properties.
//   - 52711 is a large prime number used as a second accumulator to extend the bit width and further reduce hash collisions.
// This dual-accumulator approach helps produce a more stable and unique hash for string inputs.
function hashStringToNumber(input: string): number {
  let h1 = 5381;
  let h2 = 52711;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = (h1 * 33) ^ ch;
    h2 = (h2 * 33) ^ ch;
  }
  // Combine to a positive 53-bit integer
  const combined = (h1 >>> 0) * 0x1000 + ((h2 >>> 0) & 0x0fff);
  return combined;
}

function mapStorageIssueToGitHubIssue(issue: StorageIssue, mirror?: MirrorStateEntry): GitHubIssue {
  const repositoryUrl = `https://github.com/${issue.owner}/${issue.repo}`;
  // Note: UI code expects a numeric `id` to use in DOM attributes and URL params.
  // GitHub's `node_id` is globally unique but a string; we derive a stable numeric id from it.
  const id = hashStringToNumber(issue.node_id);
  const assigneesArr: unknown[] = mirror && Array.isArray(mirror.assignees) ? (mirror.assignees as unknown[]) : [];
  const isAssigned = mirror?.assigned === true || assigneesArr.length > 0;
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
    assigned: isAssigned,
    assignee: isAssigned && assigneesArr.length > 0 ? assigneesArr[0] : null,
    assignees: assigneesArr,
  };
}

async function fetchIssues(): Promise<GitHubIssue[]> {
  const base = "https://raw.githubusercontent.com/devpool-directory/devpool-directory/__STORAGE__";
  // Fetch all three resources in parallel
  const [pricedRes, mirrorRes, proposalsRes] = await Promise.all([
    fetch(`${base}/partner-open-issues.json`),
    fetch(`${base}/mirror-state.json`),
    fetch(`${base}/partner-open-proposals.json`),
  ]);

  // Parse JSON in parallel
  const [pricedJson, mirrorJson, proposalsJson]: [StorageIssue[], Record<string, MirrorStateEntry>, StorageIssue[]] = await Promise.all([
    pricedRes.json(),
    mirrorRes.json(),
    proposalsRes.json(),
  ]);

  const priced = pricedJson.map((it) => mapStorageIssueToGitHubIssue(it, mirrorJson[it.node_id]));
  const proposals = proposalsJson.map((it) => mapStorageIssueToGitHubIssue(it, mirrorJson[it.node_id]));

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
