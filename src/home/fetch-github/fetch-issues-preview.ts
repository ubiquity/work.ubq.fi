import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { GitHubIssue } from "../github-types";
import { taskManager } from "../home";
import { displayPopupMessage } from "../rendering/display-popup-modal";
import { TaskNoFull } from "./preview-to-full-mapping";

async function checkPrivateRepoAccess(): Promise<boolean> {
  //const octokit = new Octokit({ auth: await getGitHubAccessToken() });
  // const username = getGitHubUserName();

  try {
    //   const response = await octokit.repos.checkCollaborator({
    //     owner: "ubiquity",
    //     repo: "devpool-directory-private",
    //     username,
    //   });

    //   if (response.status === 204) {
    //     // If the response is successful, it means the user has access to the private repository
    //     return true;
    //   }
    //   return false;
    return true;
  } catch (error) {
    if (error.status === 404) {
      // If the status is 404, it means the user is not a collaborator, hence no access
      return false;
    } else {
      // Handle other errors if needed
      console.error("Error checking repository access:", error);
      throw error;
    }
  }
}

export async function fetchIssuePreviews(): Promise<TaskNoFull[]> {
  const octokit = new Octokit({ auth: await getGitHubAccessToken() });

  let freshIssues: GitHubIssue[] = [];
  let hasPrivateRepoAccess = false; // Flag to track access to the private repository

  try {
    // Check if the user has access to the private repository
    hasPrivateRepoAccess = await checkPrivateRepoAccess();

    // Fetch issues from public repository
    const publicResponse = await octokit.paginate<GitHubIssue>("GET /repos/ubiquity/devpool-directory/issues", { state: "open" });
    const publicIssues = publicResponse.filter((issue: GitHubIssue) => !issue.pull_request);

    // Fetch issues from the private repository only if the user has access
    if (hasPrivateRepoAccess) {
      const privateResponse = await octokit.paginate<GitHubIssue>("GET /repos/ubiquity/devpool-directory-private/issues", { state: "open" });
      const privateIssues = privateResponse.filter((issue: GitHubIssue) => !issue.pull_request);

      // Mark private issues
      const privateIssuesWithFlag = privateIssues.map((issue) => {
        issue.private = true;
        return issue;
      });

      // Combine public and private issues
      freshIssues = [...privateIssuesWithFlag, ...publicIssues];
    } else {
      // If user doesn't have access, only load issues from the public repository
      freshIssues = publicIssues;
    }
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
