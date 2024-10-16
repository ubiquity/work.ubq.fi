import { initOctokit } from "./init-octokit";
import { GitHubNotification } from "../../github-types";

export async function checkIfDraftPullRequest(notification: GitHubNotification): Promise<boolean> {
  try {
    const octokit = await initOctokit();

    const [owner, repo, , pullNumber] = notification.subject.url.split("/").slice(-4);
    const { data: pullRequest } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: parseInt(pullNumber),
    });
    return pullRequest.draft === true;
  } catch (error) {
    console.error("Error checking draft pull request:", error);
    return false;
  }
}
