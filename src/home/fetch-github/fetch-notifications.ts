import { Octokit } from "@octokit/rest";
import { GitHubNotification } from "../github-types";

export async function fetchNotifications(octokit: Octokit): Promise<GitHubNotification[]> {
  const { data: notifications } = await octokit.activity.listNotificationsForAuthenticatedUser({
    all: true,
    per_page: 100,
  });

  return notifications;
}
