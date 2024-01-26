import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { GitHubIssue } from "../github-types";
import { GitHubIssueWithNewFlag } from "./preview-to-full-mapping";

export async function fetchIssuePreviews(): Promise<GitHubIssueWithNewFlag[]> {
  const octokit = new Octokit({ auth: getGitHubAccessToken() });

  // Fetch fresh issues and mark them as new if they don't exist in local storage
  let freshIssues: GitHubIssue[] = [];
  try {
    freshIssues = (
      await octokit.paginate<GitHubIssue>("GET /repos/ubiquity/devpool-directory/issues", {
        state: "open",
      })
    ).filter((issue: GitHubIssue) => !issue.pull_request);
  } catch (error) {
    console.error(`Failed to fetch issue previews: ${error}`);
  }

  return freshIssues.map((issue) => ({
    ...issue,
    isNew: true,
  }));
}
