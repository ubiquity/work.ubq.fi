import { getImageFromCache } from "../getters/get-indexed-db";
import { getLocalStore } from "../getters/get-local-store";
import { taskManager } from "../home";
import { renderGitHubIssues } from "../rendering/render-github-issues";
import { Sorting } from "../sorting/generate-sorting-buttons";
import { sortIssuesController } from "../sorting/sort-issues-controller";
import { fetchAvatar } from "./fetch-avatar";
import { organizationImageCache } from "./fetch-issues-full";
import { fetchIssuePreviews } from "./fetch-issues-preview";
import { TaskMaybeFull, TaskNoFull, TaskNoState, TaskWithFull } from "./preview-to-full-mapping";

export type Options = {
  ordering: "normal" | "reverse";
};

export async function fetchAndDisplayPreviewsFromCache(sorting?: Sorting, options = { ordering: "normal" }) {
  const _cachedTasks = (getLocalStore("gitHubTasks") || []) as TaskNoState[];
  const cachedTasks = _cachedTasks.map((task) => ({ ...task, isNew: false, isModified: false })) as TaskMaybeFull[];
  taskManager.addTasks(cachedTasks);
  if (!cachedTasks.length) {
    // load from network if there are no cached issues
    return await fetchAndDisplayPreviewsFromNetwork(sorting, options);
  } else {
    displayGitHubIssues(sorting, options); // FIXME:
    return fetchAvatars();
  }
}

export async function fetchAndDisplayPreviewsFromNetwork(sorting?: Sorting, options = { ordering: "normal" }) {
  const fetchedPreviews = await fetchIssuePreviews();
  const cachedTasks = taskManager.getTasks();
  const updatedCachedIssues = verifyGitHubIssueState(cachedTasks, fetchedPreviews);
  displayGitHubIssues(sorting, options); // FIXME:
  taskManager.addTasks(updatedCachedIssues);
  return fetchAvatars();
}

async function fetchAvatars() {
  const cachedTasks = taskManager.getTasks();
  const urlPattern = /https:\/\/github\.com\/(?<org>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issue_number>\d+)/;

  const avatarPromises = cachedTasks.map(async (task) => {
    const match = task.preview.body.match(urlPattern);
    const orgName = match?.groups?.org;
    if (orgName) {
      return fetchAvatar(orgName);
    }
    return Promise.resolve();
  });

  await Promise.allSettled(avatarPromises);
  return cachedTasks;
}

export function taskWithFullTest(task: TaskNoFull | TaskWithFull): task is TaskWithFull {
  return (task as TaskWithFull).full !== null && (task as TaskWithFull).full !== undefined;
}

function verifyGitHubIssueState(cached: TaskMaybeFull[], fetchedPreviews: TaskNoFull[]): (TaskNoFull | TaskWithFull)[] {
  return fetchedPreviews.map((fetched) => {
    const cachedIssue = cached.find((cached) => cached.full?.id === fetched.preview.id);
    if (cachedIssue && cachedIssue.full) {
      const cachedFullIssue = cachedIssue.full;
      const isModified = new Date(cachedFullIssue.updated_at) < new Date(fetched.preview.updated_at);
      const task = { ...fetched, full: cachedFullIssue, isNew: false, isModified };
      return taskWithFullTest(task) ? task : ({ preview: fetched.preview, isNew: true, isModified: false } as TaskNoFull);
    }
    return { preview: fetched.preview, isNew: true, isModified: false } as TaskNoFull;
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
  renderGitHubIssues(sortedIssues);
}
