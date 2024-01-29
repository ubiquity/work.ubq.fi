import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { GitHubIssue } from "../github-types";
import { TaskNoFull } from "./preview-to-full-mapping";

export async function fetchIssuePreviews(): Promise<TaskNoFull[]> {
  const octokit = new Octokit({ auth: getGitHubAccessToken() });

  let freshIssues: GitHubIssue[] = [];
  try {
    const response = await octokit.paginate<GitHubIssue>("GET /repos/ubiquity/devpool-directory/issues", { state: "open" });

    freshIssues = response.filter((issue: GitHubIssue) => !issue.pull_request);
  } catch (error) {
    if (403 === error.status) {
      console.error(`GitHub API rate limit exceeded.`);
      const resetTime = error.headers["x-ratelimit-reset"];
      const resetParsed = new Date(resetTime * 1000).toLocaleTimeString();
      document.getElementById(`github-login-button`)?.click(); // automatic login
      alert(`You have been rate limited. You must log in to GitHub to increase your GitHub API limits, otherwise please try again at ${resetParsed}.`);
    } else {
      console.error(`Failed to fetch issue previews: ${error}`);
    }
  }

  const tasks = freshIssues.map((preview: GitHubIssue) => ({
    preview: preview,
    full: null,
    isNew: true,
    isModified: true,
  })) as TaskNoFull[];

  return tasks;
}
