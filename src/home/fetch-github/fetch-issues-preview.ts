import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { GitHubIssue } from "../github-types";
import { taskManager } from "../home";
import { displayPopupMessage } from "../rendering/display-popup-modal";
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
      if (taskManager.getTasks().length == 0) {
        // automatically login if there are no issues loaded
        automaticLogin(error);
      }
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
function automaticLogin(error: unknown) {
  const resetTime = error.response.headers["x-ratelimit-reset"];
  const resetParsed = new Date(resetTime * 1000).toLocaleTimeString();

  displayPopupMessage(
    `GitHub API rate limit exceeded.`,
    `You have been rate limited. Please log in to GitHub to increase your GitHub API limits, otherwise you can try again at ${resetParsed}.`
  );
}
