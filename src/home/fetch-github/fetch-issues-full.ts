import { GitHubIssue } from "../github-types";
export const organizationImageCache = new Map<string, Blob | null>();

// export async function fetchIssuesFull(taskPreviews: GitHubIssue[]): Promise<TaskWithFull[]> {
//   const octokit = new Octokit({ auth: await getGitHubAccessToken() });
//   const urlPattern = /https:\/\/github\.com\/(?<org>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issue_number>\d+)/;

//   const fullTaskPromises = taskPreviews.map(async (task) => {
//     const match = task.preview.body.match(urlPattern);

//     if (!match || !match.groups) {
//       console.error("Invalid issue body URL format");
//       return Promise.resolve(null);
//     }

//     const { org, repo, issue_number } = match.groups;

//     const { data: response } = await octokit.request("GET /repos/{org}/{repo}/issues/{issue_number}", { issue_number, repo, org });

//     task.full = response as GitHubIssue;

//     const urlMatch = task.full.html_url.match(urlPattern);
//     const orgName = urlMatch?.groups?.org;
//     if (orgName) {
//       await fetchAvatar(orgName);
//     }
//     const isTaskWithFull = taskWithFullTest(task);

//     if (isTaskWithFull) {
//       return task;
//     } else {
//       throw new Error("Task is not a TaskWithFull");
//     }
//   });

//   const settled = await Promise.allSettled(fullTaskPromises);
//   const fullTasks = settled
//     .filter((result): result is PromiseFulfilledResult<TaskWithFull> => result.status === "fulfilled")
//     .map((result) => result.value)
//     .filter((issue): issue is TaskWithFull => issue !== null);

//   return fullTasks;
// }
export async function fetchIssuesFull(): Promise<GitHubIssue[]> {
  const response = await fetch("https://raw.githubusercontent.com/ubiquity/devpool-directory/refs/heads/development/devpool-issues.json");
  const jsonData = await response.json();
  return jsonData;
}
