import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { GitHubIssue } from "../github-types";
import { GitHubIssueWithNewFlag } from "./preview-to-full-mapping";

export async function fetchIssuePreviews(): Promise<GitHubIssueWithNewFlag[]> {
  const octokit = new Octokit({ auth: getGitHubAccessToken() });

  try {
    const { data: rateLimit } = await octokit.request("GET /rate_limit");
    console.log("Rate limit remaining: ", rateLimit.rate.remaining);
  } catch (error) {
    console.error(error);
  }
  // Fetch fresh issues and mark them as new if they don't exist in local storage
  const freshIssues: GitHubIssue[] = await octokit.paginate("GET /repos/ubiquity/devpool-directory/issues", {
    state: "open",
  });

  // Retrieve existing issues from local storage
  const storedIssuesJSON = localStorage.getItem("gitHubIssuesPreview");
  const storedIssues = storedIssuesJSON ? (JSON.parse(storedIssuesJSON) as GitHubIssue[]) : [];

  // Create a set of existing issue IDs for quick lookup
  const existingIssueIds = new Set(storedIssues.map((issue) => issue.id));

  // Map fresh issues to GitHubIssueWithNewFlag, setting isNew appropriately
  const freshIssuesWithNewFlag = freshIssues.map((issue) => ({
    ...issue,
    isNew: !existingIssueIds.has(issue.id),
  })) as GitHubIssueWithNewFlag[];

  localStorage.setItem("gitHubIssuesPreview", JSON.stringify(freshIssuesWithNewFlag));

  return freshIssuesWithNewFlag;
}
