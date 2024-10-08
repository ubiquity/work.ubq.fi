import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { getLocalStore } from "../getters/get-local-store";
import { GITHUB_TASKS_STORAGE_KEY, GitHubIssue, TaskStorageItems } from "../github-types";
import { taskManager } from "../home";
import { applyAvatarsToIssues, renderGitHubIssues } from "../rendering/render-github-issues";
import { Sorting } from "../sorting/generate-sorting-buttons";
import { sortIssuesController } from "../sorting/sort-issues-controller";
import { fetchAvatar } from "./fetch-avatar";

export type Options = {
  ordering: "normal" | "reverse";
};

let isProposalOnlyViewer = false;

export const viewToggle = document.getElementById("view-toggle") as HTMLInputElement;
if (!viewToggle) {
  throw new Error("Could not find view toggle");
}
viewToggle.addEventListener("click", () => {
  isProposalOnlyViewer = !isProposalOnlyViewer;
  displayGitHubIssues();
  applyAvatarsToIssues();
});

export async function fetchAndDisplayPreviewsFromCache(sorting?: Sorting, options = { ordering: "normal" }) {
  let _cachedTasks = getLocalStore(GITHUB_TASKS_STORAGE_KEY) as TaskStorageItems;
  const _accessToken = await getGitHubAccessToken();

  if (_cachedTasks && !_cachedTasks.loggedIn && _accessToken) {
    // checks if the user has logged in and resets cache
    localStorage.removeItem(GITHUB_TASKS_STORAGE_KEY);
    return fetchAndDisplayIssuesFromNetwork(sorting, options);
  }

  if (_cachedTasks && _cachedTasks.loggedIn && !_accessToken) {
    // checks if the user has logged out and resets cache
    localStorage.removeItem(GITHUB_TASKS_STORAGE_KEY);
    return fetchAndDisplayIssuesFromNetwork(sorting, options);
  }

  if (!_cachedTasks || !_cachedTasks.timestamp || _cachedTasks.timestamp + 60 * 1000 * 15 <= Date.now()) {
    // checks if cache is older than 15 minutes and resets if so
    _cachedTasks = {
      timestamp: Date.now(),
      tasks: [],
      loggedIn: _accessToken !== null,
    };
  }

  const cachedTasks = _cachedTasks.tasks;
  taskManager.syncTasks(cachedTasks); // this takes the cached tasks and recaches them, seems ugly. it also reapplies avatars

  if (!cachedTasks.length) {
    return fetchAndDisplayIssuesFromNetwork(sorting, options);
  } else {
    displayGitHubIssues(sorting, options); // currently this is the exact same as the above, so it's redundant and check is unnecessary
    return fetchAvatars();
  }
}

// this does not fetch issues. calling fetchAvatars() might be redundant too but it's O(1) since it's in cache
export async function fetchAndDisplayIssuesFromNetwork(sorting?: Sorting, options = { ordering: "normal" }) {
  displayGitHubIssues(sorting, options);
  return fetchAvatars();
}

export async function fetchAvatars() {
  const cachedTasks = taskManager.getTasks();

  // fetches avatar for each organization for each task, but fetchAvatar() will only fetch once per organization
  const avatarPromises = cachedTasks.map(async (task: GitHubIssue) => {
    const [orgName] = task.repository_url.split("/").slice(-2);
    if (orgName) {
      return fetchAvatar(orgName);
    }
    return Promise.resolve();
  });

  await Promise.allSettled(avatarPromises);
  applyAvatarsToIssues();
}

export function displayGitHubIssues(sorting?: Sorting, options = { ordering: "normal" }) {
  const cached = taskManager.getTasks();
  const sortedIssues = sortIssuesController(cached, sorting, options);
  const sortedAndFiltered = sortedIssues.filter(getProposalsOnlyFilter(isProposalOnlyViewer));
  // applyAvatarsToIssues could be called here only or within renderGitHubIssues
  renderGitHubIssues(sortedAndFiltered);
}

function getProposalsOnlyFilter(getProposals: boolean) {
  return (issue: GitHubIssue) => {
    if (!issue?.labels) return false;

    const hasPriceLabel = issue.labels.some((label) => {
      if (typeof label === "string") return false;
      return label.name?.startsWith("Price: ") || label.name?.startsWith("Price: ");
    });

    return getProposals ? !hasPriceLabel : hasPriceLabel;
  };
}
