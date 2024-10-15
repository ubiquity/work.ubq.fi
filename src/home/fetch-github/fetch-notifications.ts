import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { GitHubNotification } from "../github-types";

export async function fetchNotifications(): Promise<GitHubNotification[]> {
  const accessToken = await getGitHubAccessToken();

  if (!accessToken) {
    throw new Error("GitHub access token not found");
  }

  const octokit = new Octokit({ auth: accessToken });

  const { data: notifications } = await octokit.activity.listNotificationsForAuthenticatedUser({
    all: true,
    per_page: 100,
  });

  return notifications;
}
