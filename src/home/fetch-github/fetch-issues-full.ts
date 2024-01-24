import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { getLocalStore } from "../getters/get-local-store";
import { GitHubIssue } from "../github-types";
import { fetchAvatar } from "./fetch-avatar";
import { PreviewToFullMapping } from "./preview-to-full-mapping";

export const previewToFullMapping = new PreviewToFullMapping().getMapping();

export const organizationImageCache = new Map<string, Blob | null>();

export function fetchIssuesFull(previews: GitHubIssue[]) {
  const authToken = getGitHubAccessToken();
  if (!authToken) throw new Error("No auth token found");
  const octokit = new Octokit({ auth: getGitHubAccessToken() });
  const urlPattern = /https:\/\/github\.com\/(?<org>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issue_number>\d+)/;

  const cachedPreviews = previews || (getLocalStore("gitHubIssuesPreview") as GitHubIssue[]);

  const issueFetchPromises = cachedPreviews.map((preview) => {
    const match = preview.body.match(urlPattern);

    if (!match || !match.groups) {
      console.error("Invalid issue body URL format");
      return Promise.resolve(null);
    }

    const { org, repo, issue_number } = match.groups;

    return octokit
      .request("GET /repos/{org}/{repo}/issues/{issue_number}", { issue_number, repo, org })
      .then(({ data: response }) => {
        const full = response as GitHubIssue;

        previewToFullMapping.set(preview.id, full);
        const issueElement = document.querySelector(`[data-preview-id="${preview.id}"]`);
        issueElement?.setAttribute("data-full-id", full.id.toString());
        // const imageElement = issueElement?.querySelector("img");

        localStorage.setItem("gitHubIssuesFull", JSON.stringify(Array.from(previewToFullMapping.entries())));
        return { full, issueElement };
      })
      .then(async ({ full }) => {
        const urlMatch = full.html_url.match(urlPattern);
        const orgName = urlMatch?.groups?.org;
        if (orgName) {
          await fetchAvatar(orgName);
        }
        return full;
      });
  });

  return issueFetchPromises;
}
