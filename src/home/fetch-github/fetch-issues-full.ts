import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { getLocalStore } from "../getters/get-local-store";
import { GitHubIssue } from "../github-types";
import { PreviewToFullMapping } from "./preview-to-full-mapping";

export const mapping = new PreviewToFullMapping().getMapping();

export function fetchIssuesFull(previews: GitHubIssue[]) {
  const authToken = getGitHubAccessToken();
  if (!authToken) throw new Error("No auth token found");
  console.trace(`fetching full issues`);
  const octokit = new Octokit({ auth: getGitHubAccessToken() });
  const urlPattern = /https:\/\/github\.com\/(?<org>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issue_number>\d+)/;

  const cachedIssues = previews || (getLocalStore("gitHubIssuePreview") as GitHubIssue[]);

  const issueFetchPromises = cachedIssues.map((preview) => {
    const match = preview.body.match(urlPattern);
    if (!match || !match.groups) {
      console.error("Invalid issue body URL format");
      return Promise.resolve(null);
    }

    const { org, repo, issue_number } = match.groups;

    return octokit.request("GET /repos/{org}/{repo}/issues/{issue_number}", { issue_number, repo, org }).then(({ data: full }) => {
      mapping.set(preview.id, full);
      document.querySelector(`[data-issue-id="${preview.id}"]`)?.setAttribute("data-full-id", full.id);
      console.trace({ mapping, stringified: JSON.stringify([...mapping]) });
      localStorage.setItem("gitHubIssuesFull", JSON.stringify(Array.from(mapping.entries())));
      return full;
    });
  });

  return Promise.allSettled(issueFetchPromises).then((results) => {
    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value !== null) {
        mapping.set(result.value.id, result.value);
      }
    });
    return mapping;
  });
}
