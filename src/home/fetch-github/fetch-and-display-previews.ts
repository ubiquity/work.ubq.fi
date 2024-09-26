import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { getImageFromCache } from "../getters/get-indexed-db";
import { getLocalStore } from "../getters/get-local-store";
import { GITHUB_TASKS_STORAGE_KEY, TaskStorageItems } from "../github-types";
import { taskManager } from "../home";
import { applyAvatarsToIssues, renderGitHubIssues } from "../rendering/render-github-issues";
import { Sorting } from "../sorting/generate-sorting-buttons";
import { sortIssuesController } from "../sorting/sort-issues-controller";
import { fetchAvatar } from "./fetch-avatar";
import { organizationImageCache } from "./fetch-issues-full";
import { fetchIssuePreviews } from "./fetch-issues-preview";
import { TaskMaybeFull, TaskNoFull, TaskWithFull } from "./preview-to-full-mapping";

export type Options = {
  ordering: "normal" | "reverse";
};

let isProposalOnlyViewer = false; // or proposal viewer

const viewToggle = document.getElementById("view-toggle");
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

  // Refresh the storage if there is no logged-in object in cachedTasks but there is one now.
  if (_cachedTasks && !_cachedTasks.loggedIn && _accessToken) {
    localStorage.removeItem(GITHUB_TASKS_STORAGE_KEY);
    return fetchAndDisplayPreviewsFromNetwork(sorting, options);
  }

  // If previously logged in but not anymore, clear cache and fetch from network.
  if (_cachedTasks && _cachedTasks.loggedIn && !_accessToken) {
    localStorage.removeItem(GITHUB_TASKS_STORAGE_KEY);
    return fetchAndDisplayPreviewsFromNetwork(sorting, options);
  }

  // makes sure tasks have a timestamp to know how old the cache is, or refresh if older than 15 minutes
  if (!_cachedTasks || !_cachedTasks.timestamp || _cachedTasks.timestamp + 60 * 1000 * 15 <= Date.now()) {
    _cachedTasks = {
      timestamp: Date.now(),
      tasks: [],
      loggedIn: _accessToken !== null,
    };
  }

  const cachedTasks = _cachedTasks.tasks as TaskMaybeFull[];
  taskManager.syncTasks(cachedTasks);

  if (!cachedTasks.length) {
    // load from network if there are no cached issues
    return fetchAndDisplayPreviewsFromNetwork(sorting, options);
  } else {
    displayGitHubIssues(sorting, options);
    return fetchAvatars();
  }
}

export async function fetchAndDisplayPreviewsFromNetwork(sorting?: Sorting, options = { ordering: "normal" }) {
  const fetchedPreviews = await fetchIssuePreviews();
  const cachedTasks = taskManager.getTasks();
  const updatedCachedIssues = verifyGitHubIssueState(cachedTasks, fetchedPreviews);
  taskManager.syncTasks(updatedCachedIssues);
  displayGitHubIssues(sorting, options);
  return fetchAvatars();
}

export async function fetchAvatars() {
  const cachedTasks = taskManager.getTasks();
  const urlPattern = /https:\/\/github\.com\/(?<org>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issue_number>\d+)/;

  const avatarPromises = cachedTasks.map(async (task) => {
    const match = task.preview.body?.match(urlPattern);
    const orgName = match?.groups?.org;
    if (orgName) {
      return fetchAvatar(orgName);
    }
    return Promise.resolve();
  });

  await Promise.allSettled(avatarPromises);
  applyAvatarsToIssues();
  return cachedTasks;
}

export function taskWithFullTest(task: TaskNoFull | TaskWithFull): task is TaskWithFull {
  return (task as TaskWithFull).full !== null && (task as TaskWithFull).full !== undefined;
}

export function verifyGitHubIssueState(cachedTasks: TaskMaybeFull[], fetchedPreviews: TaskNoFull[]): (TaskNoFull | TaskWithFull)[] {
  return fetchedPreviews.map((fetched) => {
    const cachedTask = cachedTasks.find((c) => c.full?.id === fetched.preview.id);
    if (cachedTask) {
      if (taskWithFullTest(cachedTask)) {
        const cachedFullIssue = cachedTask.full;
        const task = { ...fetched, full: cachedFullIssue };
        return task;
      } else {
        // no full issue in task
      }
    } else {
      // no cached task
    }
    return {
      preview: fetched.preview,
    } as TaskNoFull;
  });
}

export function displayGitHubIssues(sorting?: Sorting, options = { ordering: "normal" }) {
  // Load avatars from cache
  const urlPattern = /https:\/\/github\.com\/(?<org>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issue_number>\d+)/;
  const cachedTasks = taskManager.getTasks();
  cachedTasks.forEach(async ({ preview }) => {
    if (!preview.body) {
      throw new Error(`Preview body is undefined for task with id: ${preview.id}`);
    }
    const match = preview.body.match(urlPattern);
    const orgName = match?.groups?.org;
    if (orgName) {
      const avatarUrl = await getImageFromCache({ dbName: "GitHubAvatars", storeName: "ImageStore", orgName: `avatarUrl-${orgName}` });
      if (avatarUrl) {
        organizationImageCache.set(orgName, avatarUrl);
      }
    }
  });

  // Render issues
  const sortedIssues = sortIssuesController(cachedTasks, sorting, options);
  const sortedAndFiltered = sortedIssues.filter(getProposalsOnlyFilter(isProposalOnlyViewer));
  renderGitHubIssues(sortedAndFiltered);
}

function getProposalsOnlyFilter(getProposals: boolean) {
  return (task: TaskMaybeFull) => {
    if (!task.full?.labels) return false;

    const hasPriceLabel = task.full.labels.some((label) => {
      if (typeof label === "string") return false;
      return label.name?.startsWith("Price: ") || label.name?.startsWith("Pricing: ");
    });

    // If getProposals is true, we want tasks WITHOUT price labels
    // If getProposals is false, we want tasks WITH price labels
    return getProposals ? !hasPriceLabel : hasPriceLabel;
  };
}
