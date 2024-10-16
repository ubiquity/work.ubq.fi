import { Octokit } from "@octokit/rest";
import { GitHubNotification } from "../github-types";

export async function fetchNotifications(octokit: Octokit): Promise<GitHubNotification[]> {
  const allNotifications: GitHubNotification[] = [];
  let page = 1;
  const perPage = 100; // Maximum allowed by GitHub API
  const maxPages = 5; // Limit to 5 pages

  while (page <= maxPages) {
    const { data: notifications, headers } = await octokit.activity.listNotificationsForAuthenticatedUser({
      all: true,
      per_page: perPage,
      page,
    });

    allNotifications.push(...notifications);

    // Check if there are more pages
    const linkHeader = headers.link;
    if (!linkHeader || !linkHeader.includes('rel="next"')) {
      break; // No more pages
    }

    page++; // Move to the next page
  }

  console.trace({ allNotifications });
  return allNotifications;
}
