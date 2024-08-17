declare const IS_RFC: boolean;
import { RequestError } from "@octokit/request-error";
import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken, getGitHubUserName } from "../getters/get-github-access-token";
import { GitHubIssue, GitHubLabel } from "../github-types";
import { displayPopupMessage } from "../rendering/display-popup-modal";
import { handleRateLimit } from "./handle-rate-limit";
import { TaskNoFull } from "./preview-to-full-mapping";

async function checkPrivateRepoAccess(): Promise<boolean> {
  const octokit = new Octokit({ auth: await getGitHubAccessToken() });
  const username = getGitHubUserName();

  if (username) {
    try {
      const response = await octokit.repos.checkCollaborator({
        owner: "ubiquity",
        repo: "devpool-directory-private",
        username,
      });

      if (response.status === 204) {
        // If the response is successful, it means the user has access to the private repository
        return true;
      }
      return false;
    } catch (error) {
      if (!!error && typeof error === "object" && "status" in error && (error.status === 404 || error.status === 401)) {
        // If the status is 404, it means the user is not a collaborator, hence no access
        return false;
      } else {
        // Handle other errors if needed
        console.error("Error checking repository access:", error);
        throw error;
      }
    }
  }

  return false;
}

export async function fetchIssuePreviews(): Promise<TaskNoFull[]> {
  const octokit = new Octokit({ auth: await getGitHubAccessToken() });
  let freshIssues: GitHubIssue[] = [];
  let hasPrivateRepoAccess = false; // Flag to track access to the private repository

  try {
    // Check if the user has access to the private repository
    hasPrivateRepoAccess = await checkPrivateRepoAccess();

    // Fetch issues from public repository
    const publicResponse = await octokit.paginate(
      octokit.issues.listForRepo,
      {
        owner: "ubiquity",
        repo: "devpool-directory",
        state: "open",
        per_page: 100,
      },
      (response) => response.data
    );

    const publicIssues = publicResponse.filter((issue: GitHubIssue) => !issue.pull_request);

    // Fetch issues from the private repository only if the user has access
    if (hasPrivateRepoAccess) {
      await fetchPrivateIssues(publicIssues);
    } else {
      // If user doesn't have access, only load issues from the public repository
      freshIssues = publicIssues;
    }
  } catch (error) {
    if (!!error && typeof error === "object" && "status" in error && error.status === 403) {
      await handleRateLimit(octokit, error as RequestError);
    } else {
      throw error;
    }
  }

  const tasks = freshIssues.filter((issue: GitHubIssue) => (issue.labels as GitHubLabel[]).some((label) => label.name.includes("Pricing")) == !IS_RFC).map((preview: GitHubIssue) => ({
    preview: preview,
    full: null,
    isNew: true,
    isModified: true,
  })) as TaskNoFull[];

  return tasks;

  async function fetchPrivateIssues(publicIssues: GitHubIssue[]) {
    const { data: privateResponse } = await octokit.issues.listForRepo({
      owner: "ubiquity",
      repo: "devpool-directory-private",
      state: "open",
    });
    const privateIssues = privateResponse.filter((issue: GitHubIssue) => !issue.pull_request);

    // Mark private issues
    // TODO: indicate private issues in the UI

    // const privateIssuesWithFlag = privateIssues.map((issue) => {
    //   return issue;
    // });

    // Combine public and private issues
    freshIssues = [...privateIssues, ...publicIssues];
  }
}

export function rateLimitModal(message: string) {
  displayPopupMessage({ modalHeader: `GitHub API rate limit exceeded.`, modalBody: message, isError: false });
}
