import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { getLocalStore } from "../getters/get-local-store";
import { GitHubIssue } from "../github-types";
import { PreviewToFullMapping } from "./preview-to-full-mapping";

export const mapping = new PreviewToFullMapping().getMapping();

export async function fetchIssuesFull() {
  const authToken = getGitHubAccessToken();
  if (!authToken) throw new Error("No auth token found");
  console.trace(`fetching full issues`);
  const octokit = new Octokit({ auth: getGitHubAccessToken() });
  const urlPattern = /https:\/\/github\.com\/(?<org>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issue_number>\d+)/;

  const cachedIssues = getLocalStore("gitHubIssuePreviews") as GitHubIssue[];

  for (const preview of cachedIssues) {
    const match = preview.body.match(urlPattern);
    if (!match || !match.groups) {
      console.error("Invalid issue body URL format");
      continue;
    }

    const { org, repo, issue_number } = match.groups;

    const { data: full } = await octokit.request("GET /repos/{org}/{repo}/issues/{issue_number}", { issue_number, repo, org });
    mapping.set(preview.id, full);
    console.trace({ [preview.id]: full });
    document.querySelector(`[data-issue-id="${preview.id}"]`)?.setAttribute("data-full-id", full.id);
  }

  return mapping;
}
