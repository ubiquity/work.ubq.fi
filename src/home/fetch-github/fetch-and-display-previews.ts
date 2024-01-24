import { getImageFromDB } from "../getters/get-indexed-db";
import { getLocalStore } from "../getters/get-local-store";
import { GitHubIssue } from "../github-types";
import { renderGitHubIssues } from "../rendering/render-github-issues";
import { Sorting } from "../sorting/generate-sorting-buttons";
import { sortIssuesController } from "../sorting/sort-issues-controller";
import { fetchAvatar } from "./fetch-avatar";
import { organizationImageCache } from "./fetch-issues-full";
import { fetchIssuePreviews } from "./fetch-issues-preview";

export type Options = {
  ordering: "normal" | "reverse";
};

export async function fetchAndDisplayPreviews(sorting?: Sorting, options = { ordering: "normal" }) {
  const container = document.getElementById("issues-container") as HTMLDivElement;
  if (!container) {
    throw new Error("Could not find issues container");
  }
  let issues: GitHubIssue[] = (getLocalStore("gitHubIssuesPreview") as GitHubIssue[]) || [];
  if (!issues.length) {
    issues = await fetchIssuePreviews();
    localStorage.setItem("gitHubIssuesPreview", JSON.stringify(issues));
  }
  const urlPattern = /https:\/\/github\.com\/(?<org>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issue_number>\d+)/;

  const avatarPromises = issues.map(async (issue) => {
    const match = issue.body.match(urlPattern);
    const orgName = match?.groups?.org;
    if (orgName) {
      return fetchAvatar(orgName);
    }
    return Promise.resolve();
  });

  return Promise.allSettled(avatarPromises).then(() => {
    displayIssues(issues, container, sorting, options);
    return issues;
  });
}

function displayIssues(issues: GitHubIssue[], container: HTMLDivElement, sorting?: Sorting, options = { ordering: "normal" }) {
  // Load avatars from cache
  const urlPattern = /https:\/\/github\.com\/(?<org>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issue_number>\d+)/;
  issues.forEach(async (issue) => {
    const match = issue.body.match(urlPattern);
    const orgName = match?.groups?.org;
    if (orgName) {
      const avatarUrl = await getImageFromDB({ dbName: "ImageDatabase", storeName: "ImageStore", orgName: `avatarUrl-${orgName}` });
      if (avatarUrl) {
        organizationImageCache.set(orgName, avatarUrl);
      }
    }
  });

  // Render issues
  const sortedIssues = sortIssuesController(issues, sorting, options);
  renderGitHubIssues(container, sortedIssues);
}
