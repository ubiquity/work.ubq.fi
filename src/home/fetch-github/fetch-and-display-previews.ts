import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { getImageFromCache } from "../getters/get-indexed-db";
import { getLocalStore } from "../getters/get-local-store";
import { GITHUB_TASKS_STORAGE_KEY, GitHubIssue, TaskStorageItems } from "../github-types";
import { taskManager } from "../home";
import { applyAvatarsToIssues, renderGitHubIssues } from "../rendering/render-github-issues";
import { Sorting } from "../sorting/generate-sorting-buttons";
import { sortIssuesController } from "../sorting/sort-issues-controller";
import { fetchAvatar } from "./fetch-avatar";
import { organizationImageCache } from "./fetch-issues-full";

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
    localStorage.removeItem(GITHUB_TASKS_STORAGE_KEY);
    return fetchAndDisplayIssuesFromNetwork(sorting, options);
  }

  if (_cachedTasks && _cachedTasks.loggedIn && !_accessToken) {
    localStorage.removeItem(GITHUB_TASKS_STORAGE_KEY);
    return fetchAndDisplayIssuesFromNetwork(sorting, options);
  }

  if (!_cachedTasks || !_cachedTasks.timestamp || _cachedTasks.timestamp + 60 * 1000 * 15 <= Date.now()) {
    _cachedTasks = {
      timestamp: Date.now(),
      tasks: [],
      loggedIn: _accessToken !== null,
    };
  }

  const cachedTasks = _cachedTasks.tasks;
  taskManager.syncTasks(cachedTasks);

  if (!cachedTasks.length) {
    return fetchAndDisplayIssuesFromNetwork(sorting, options);
  } else {
    displayGitHubIssues(sorting, options);
    return fetchAvatars();
  }
}

export async function fetchAndDisplayIssuesFromNetwork(sorting?: Sorting, options = { ordering: "normal" }) {
  displayGitHubIssues(sorting, options);
  return fetchAvatars();
}

export async function fetchAvatars() {
  const cachedTasks = taskManager.getTasks();

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
  cached.forEach(async (gitHubIssue) => {
    const [orgName] = gitHubIssue.repository_url.split("/").slice(-2);

    getImageFromCache({
      dbName: "GitHubAvatars",
      storeName: "ImageStore",
      orgName: `avatarUrl-${orgName}`,
    })
      .then((avatarUrl) => organizationImageCache.set(orgName, avatarUrl))
      .catch(console.error);
  });

  const sortedIssues = sortIssuesController(cached, sorting, options);
  const sortedAndFiltered = sortedIssues.filter(getProposalsOnlyFilter(isProposalOnlyViewer));
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
