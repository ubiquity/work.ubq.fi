import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../get-github-access-token";
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
  // Fetch fresh issues and mark them as new
  const freshIssues: GitHubIssue[] = await octokit.paginate("GET /repos/ubiquity/devpool-directory/issues", {
    state: "open",
  });
  const freshIssuesWithNewFlag = freshIssues.map((issue) => ({ ...issue, isNew: true })) as GitHubIssueWithNewFlag[];

  // Remove the 'isNew' flag before saving to localStorage
  const issuesToSave = freshIssuesWithNewFlag.map(({ ...issue }) => {
    delete issue.isNew;
    return issue;
  });
  localStorage.setItem("gitHubIssuePreviews", JSON.stringify(issuesToSave));
  return freshIssuesWithNewFlag;
}
