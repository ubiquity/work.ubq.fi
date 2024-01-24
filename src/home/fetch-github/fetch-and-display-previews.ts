import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { getLocalStore } from "../getters/get-local-store";
import { GitHubIssue } from "../github-types";
import { renderGitHubIssues } from "../rendering/render-github-issues";
import { Sorting } from "../sorting/generate-sorting-buttons";
import { sortIssuesController } from "../sorting/sort-issues-controller";
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
  const avatarPromises = issues.map((issue) => {
    const match = issue.body.match(urlPattern);
    const orgName = match?.groups?.org;
    if (orgName) {
      const avatarUrl = localStorage.getItem(`avatarUrl-${orgName}`);
      if (!avatarUrl) {
        // Fetch new avatar
        const octokit = new Octokit({ auth: getGitHubAccessToken() });
        return octokit.rest.orgs
          .get({ org: orgName })
          .then(({ data: { avatar_url: avatarUrl } }) => {
            if (avatarUrl) {
              localStorage.setItem(`avatarUrl-${orgName}`, avatarUrl);
              organizationImageCache.push({ [orgName]: avatarUrl });
            }
          })
          .catch((error) => {
            console.error(`Failed to fetch avatar for organization ${orgName}: ${error}`);
          });
      }
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
  issues.forEach((issue) => {
    const match = issue.body.match(urlPattern);
    const orgName = match?.groups?.org;
    if (orgName) {
      const avatarUrl = localStorage.getItem(`avatarUrl-${orgName}`);
      if (avatarUrl) {
        organizationImageCache.push({ [orgName]: avatarUrl });
      }
    }
  });

  // Render issues
  const sortedIssues = sortIssuesController(issues, sorting, options);
  renderGitHubIssues(container, sortedIssues);
}
