import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { GitHubIssue } from "../github-types";
import { TaskNoFull } from "./preview-to-full-mapping";

export async function fetchIssuePreviews(): Promise<TaskNoFull[]> {
  const octokit = new Octokit({ auth: getGitHubAccessToken() });

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

  const tasks = freshIssues.map((preview: GitHubIssue) => ({
    preview: preview,
    full: null,
    isNew: true,
    isModified: true,
  })) as TaskNoFull[];

  return tasks;
}
