import { Octokit } from "@octokit/rest";
import { GitHubNotification } from "../../github-types";
import { notificationManager, taskManager } from "../../home";
import { setupKeyboardNavigation } from "../setup-keyboard-navigation";
import { calculateNotificationScore } from "./calculate-notification-score";
import { createNewNotification } from "./create-new-notification";
import { getLinkBackCount } from "./get-link-back-count";
import { getPriorityLevel } from "./get-priority-level";
import { getRepoScore } from "./get-repo-score";
import { initOctokit } from "./init-octokit";
import { isAssociatedWithTask } from "./is-associated-with-task";

export async function renderGitHubNotifications() {
  const notifications = notificationManager.getNotifications();
  const container = taskManager.getContainer();
  const octokit = await initOctokit();

  if (container.classList.contains("ready")) {
    container.classList.remove("ready");
    container.innerHTML = "";
  }

  // Filter for unread notifications
  const unreadNotifications = notifications.filter((notification) => !notification.unread);

  const processedNotifications = await processNotifications(unreadNotifications, octokit);

  // console.trace({ processedNotifications });

  const filteredNotifications = processedNotifications.filter(
    (notification): notification is EnrichedGitHubNotification => notification !== null && !notification.isDraft
  );

  // console.trace({ filteredNotifications });

  const finalNotifications = filteredNotifications.sort((a, b) => calculateNotificationScore(b) - calculateNotificationScore(a));
  // console.trace({ finalNotifications });

  const existingNotificationIds = new Set(
    Array.from(container.querySelectorAll(".notification-element-inner")).map((element) => element.getAttribute("data-notification-id"))
  );

  let delay = 0;
  const baseDelay = 1000 / 15; // Base delay in milliseconds

  for (const notification of finalNotifications) {
    if (!existingNotificationIds.has(notification.id)) {
      const notificationWrapper = createNewNotification({ notification, container });
      if (notificationWrapper) {
        setTimeout(() => notificationWrapper.classList.add("active"), delay);
        delay += baseDelay;
      }
    }
  }
  container.classList.add("ready");

  // Call this function after the notifications have been rendered
  setupKeyboardNavigation(container);

  // Scroll to the top of the page
  window.scrollTo({ top: 0 });
}

async function processNotifications(notifications: GitHubNotification[], octokit: Octokit): Promise<(EnrichedGitHubNotification | null)[]> {
  // console.trace("processNotifications");
  return Promise.all(
    notifications.map(async (notification) => {
      const isAssociated = await isAssociatedWithTask(notification, octokit);
      if (!isAssociated) return null;

      let isDraft = false;
      if (notification.subject.type === "PullRequest") {
        isDraft = await checkIfDraftPullRequest(notification, octokit);
      }

      const priorityLevel = await getPriorityLevel(notification, octokit);
      const linkBackCount = await getLinkBackCount(notification, octokit);
      const repoScore = getRepoScore(notification.repository.id);

      return {
        ...notification,
        isDraft,
        priorityLevel,
        linkBackCount,
        repoScore,
      };
    })
  );
}

async function checkIfDraftPullRequest(notification: GitHubNotification, octokit: Octokit): Promise<boolean> {
  if (notification.subject.type !== "PullRequest") {
    return false;
  }

  const urlParts = notification.subject.url.split("/");
  if (urlParts.length < 2) {
    console.error(`Invalid URL format for pull request: ${notification.subject.url}`);
    return false;
  }

  const pullNumber = parseInt(urlParts[urlParts.length - 1], 10);
  if (isNaN(pullNumber)) {
    console.error(`Invalid pull request number: ${urlParts[urlParts.length - 1]}`);
    return false;
  }

  const owner = urlParts[urlParts.length - 4];
  const repo = urlParts[urlParts.length - 3];

  if (!owner || !repo) {
    console.error(`Failed to extract owner or repo from URL: ${notification.subject.url}`);
    return false;
  }

  try {
    const { data: pullRequest } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });
    return pullRequest.draft === true;
  } catch (error) {
    console.error(`Error checking if PR is draft: ${error}`);
    return false;
  }
}

export interface EnrichedGitHubNotification extends GitHubNotification {
  isDraft: boolean;
  priorityLevel: number;
  linkBackCount: number;
  repoScore: number;
}
