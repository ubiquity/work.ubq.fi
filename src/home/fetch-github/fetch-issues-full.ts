import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { GitHubIssue } from "../github-types";
import { taskWithFullTest } from "./fetch-and-display-previews";
import { fetchAvatar } from "./fetch-avatar";
import { TaskMaybeFull, TaskWithFull } from "./preview-to-full-mapping";

export const organizationImageCache = new Map<string, Blob | null>();

export async function fetchIssuesFull(taskPreviews: TaskMaybeFull[]): Promise<TaskWithFull[]> {
  try {
    const octokit = new Octokit({ auth: await getGitHubAccessToken() });
    const urlPattern = /https:\/\/github\.com\/(?<org>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issue_number>\d+)/;

    const fullTaskPromises = taskPreviews.map(async (task) => {
      const match = task.preview.body.match(urlPattern);

      if (!match || !match.groups) {
        console.error("Invalid issue body URL format");
        return Promise.resolve(null);
      }

      const { org, repo, issue_number } = match.groups;

      try {
        const { data: response } = await octokit.request("GET /repos/{org}/{repo}/issues/{issue_number}", { issue_number, repo, org });
        task.full = response as GitHubIssue;

        // Cache the individual issue
        const cache = await caches.open("devpool-directory-cache-v1");
        await cache.put(`/api/issues/${org}/${repo}/${issue_number}`, new Response(JSON.stringify(task.full)));
      } catch (error) {
        console.error(`Failed to fetch issue ${issue_number} from ${org}/${repo}:`, error);
        // If fetch fails, try to get the issue from cache
        const cache = await caches.open("devpool-directory-cache-v1");
        const cachedResponse = await cache.match(`/api/issues/${org}/${repo}/${issue_number}`);
        if (cachedResponse) {
          task.full = (await cachedResponse.json()) as GitHubIssue;
        } else {
          return Promise.resolve(null);
        }
      }

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

    // Cache all fetched issues
    const cache = await caches.open("devpool-directory-cache-v1");
    await cache.put("/api/issues", new Response(JSON.stringify(fullTasks)));

    return fullTasks;
  } catch (error) {
    console.error("Failed to fetch issues:", error);
    // If online fetch fails, try to get all issues from cache
    const cache = await caches.open("devpool-directory-cache-v1");
    const cachedResponse = await cache.match("/api/issues");
    if (cachedResponse) {
      return (await cachedResponse.json()) as TaskWithFull[];
    }
    return [];
  }
}
