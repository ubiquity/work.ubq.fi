import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { GitHubIssue } from "../github-types";
import { taskWithFullTest } from "./fetch-and-display-previews";
import { fetchAvatar } from "./fetch-avatar";
import { TaskMaybeFull, TaskWithFull } from "./preview-to-full-mapping";

export const organizationImageCache = new Map<string, Blob | null>();

const issuesJsonUrl = "https://raw.githubusercontent.com/ubiquity/devpool-directory/development/devpool-issues.json";

export async function fetchIssuesFull(taskPreviews: TaskMaybeFull[]): Promise<TaskWithFull[]> {
  const octokit = new Octokit({ auth: await getGitHubAccessToken() });
  const urlPattern = /https:\/\/api\.github\.com\/repos\/(?<org>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issue_number>\d+)/;
  const allIssues = await fetch(issuesJsonUrl).then((res) => res.json()) as unknown as GitHubIssue[];

  const fullTaskPromises = taskPreviews.map(async (task) => {
    const match = task.preview.url.match(urlPattern);

    if (!match || !match.groups) {
      console.error("Invalid issue body URL format");
      return Promise.resolve(null);
    }

    const { org, repo, issue_number } = match.groups;

    const response = allIssues.find((issue) => issue.number.toString() == issue_number)

    task.full = response as GitHubIssue;

    const urlMatch = task.full.html_url.match(urlPattern);
    const orgName = urlMatch?.groups?.org;
    if (orgName) {
      await fetchAvatar(orgName);
    }
    const isTaskWithFull = taskWithFullTest(task);

    if (isTaskWithFull) {
      return task;
    } else {
      throw new Error("Task is not a TaskWithFull");
    }
  });

  const settled = await Promise.allSettled(fullTaskPromises);
  const fullTasks = settled
    .filter((result): result is PromiseFulfilledResult<TaskWithFull> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((issue): issue is TaskWithFull => issue !== null);

  return fullTasks;
}
