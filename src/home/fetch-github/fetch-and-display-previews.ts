import { getImageFromCache } from "../getters/get-indexed-db";
import { getLocalStore } from "../getters/get-local-store";
import { GitHubIssue } from "../github-types";
import { renderGitHubIssues } from "../rendering/render-github-issues";
import { Sorting } from "../sorting/generate-sorting-buttons";
import { sortIssuesController } from "../sorting/sort-issues-controller";
import { fetchAvatar } from "./fetch-avatar";
import { organizationImageCache } from "./fetch-issues-full";
import { fetchIssuePreviews } from "./fetch-issues-preview";
import { GitHubIssueWithModifiedFlag, GitHubIssueWithNewFlag } from "./preview-to-full-mapping";

export type Options = {
  ordering: "normal" | "reverse";
};

// display cached issues immediately. If there are no cached issues, display nothing.
const container = document.getElementById("issues-container") as HTMLDivElement;
if (!container) {
  throw new Error("Could not find issues container");
}

export async function fetchAndDisplayPreviewsFromCache(sorting?: Sorting, options = { ordering: "normal" }) {
  const cachedIssues: GitHubIssue[] = (getLocalStore("gitHubIssuesPreview") as GitHubIssue[]) || [];

  if (!cachedIssues.length) {
    // load from network if there are no cached issues
    return await fetchAndDisplayPreviewsFromNetwork(sorting, options);
  } else {
    displayGitHubIssues(cachedIssues, container, sorting, options);
    return fetchAvatars(cachedIssues, container, options, sorting);
  }
}

export async function fetchAndDisplayPreviewsFromNetwork(sorting?: Sorting, options = { ordering: "normal" }) {
  const fetchedIssues: GitHubIssueWithNewFlag[] = await fetchIssuePreviews();
  const cachedIssues: GitHubIssue[] = (getLocalStore("gitHubIssuesPreview") as GitHubIssue[]) || [];
  const updatedCachedIssues = syncCache(cachedIssues, fetchedIssues);
  displayGitHubIssues(updatedCachedIssues, container, sorting, options);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const issuesWithoutState = updatedCachedIssues.map(({ isNew, isModified, ...issue }) => issue);
  localStorage.setItem("gitHubIssuesPreview", JSON.stringify(issuesWithoutState));
  return fetchAvatars(fetchedIssues, container, options, sorting);
}

async function fetchAvatars(cachedIssues: GitHubIssue[], container: HTMLDivElement, options: { ordering: string }, sorting?: Sorting) {
  const urlPattern = /https:\/\/github\.com\/(?<org>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issue_number>\d+)/;

  const avatarPromises = cachedIssues.map(async (issue) => {
    const match = issue.body.match(urlPattern);
    const orgName = match?.groups?.org;
    if (orgName) {
      return fetchAvatar(orgName);
    }
    return Promise.resolve();
  });

  await Promise.allSettled(avatarPromises);
  displayGitHubIssues(cachedIssues, container, sorting, options);
  return cachedIssues;
}

function syncCache(
  cachedIssues: GitHubIssue[],
  fetchedIssues: GitHubIssueWithNewFlag[]
): (GitHubIssue | GitHubIssueWithNewFlag | GitHubIssueWithModifiedFlag)[] {
  return fetchedIssues.map((newIssue) => {
    const redundantIssue = cachedIssues.find((cached) => cached.id === newIssue.id);
    if (redundantIssue) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { isNew, ...issueWithoutIsNew } = newIssue;
      return { ...issueWithoutIsNew, isModified: true } as GitHubIssueWithModifiedFlag;
    }
    return newIssue;
  });
}

function displayGitHubIssues(issues: GitHubIssue[], container: HTMLDivElement, sorting?: Sorting, options = { ordering: "normal" }) {
  // Load avatars from cache
  const urlPattern = /https:\/\/github\.com\/(?<org>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issue_number>\d+)/;
  issues.forEach(async (issue) => {
    const match = issue.body.match(urlPattern);
    const orgName = match?.groups?.org;
    if (orgName) {
      const avatarUrl = await getImageFromCache({ dbName: "GitHubAvatars", storeName: "ImageStore", orgName: `avatarUrl-${orgName}` });
      if (avatarUrl) {
        organizationImageCache.set(orgName, avatarUrl);
      }
    }
  });

  // Render issues
  const sortedIssues = sortIssuesController(issues, sorting, options);
  renderGitHubIssues(container, sortedIssues);
}
