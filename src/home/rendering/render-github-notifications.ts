import { taskManager } from "../home";
import { setupKeyboardNavigation } from "./setup-keyboard-navigation";

import icons from "./icons/notification-icons";

interface GitHubNotification {
  id: string;
  unread: boolean;
  reason: string;
  updated_at: string;
  subject: {
    title: string;
    url: string;
    type: string;
  };
  repository: {
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
  url: string;
}

export function renderGitHubNotifications(notifications: GitHubNotification[]) {
  const container = taskManager.getContainer();
  if (container.classList.contains("ready")) {
    container.classList.remove("ready");
    container.innerHTML = "";
  }
  const existingNotificationIds = new Set(
    Array.from(container.querySelectorAll(".notification-element-inner")).map((element) => element.getAttribute("data-notification-id"))
  );

  let delay = 0;
  const baseDelay = 1000 / 15; // Base delay in milliseconds

  for (const notification of notifications) {
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

function createNewNotification({ notification, container }: { notification: GitHubNotification; container: HTMLDivElement }) {
  const notificationWrapper = document.createElement("div");
  const notificationElement = document.createElement("div");
  notificationElement.setAttribute("data-notification-id", notification.id);
  notificationElement.classList.add("notification-element-inner");

  setUpNotificationElement(notificationElement, notification);
  notificationWrapper.appendChild(notificationElement);

  container.appendChild(notificationWrapper);
  return notificationWrapper;
}

function setUpNotificationElement(notificationElement: HTMLDivElement, notification: GitHubNotification) {
  let iconHtml;
  if (notification.subject.type === "PullRequest") {
    iconHtml = icons.pullRequest;
  } else if (notification.subject.type === "Issue") {
    iconHtml = icons.issue;
  } else if (notification.subject.type === "Release") {
    iconHtml = icons.release;
  } else if (notification.subject.type === "Commit") {
    iconHtml = icons.commit;
  } else if (notification.subject.type === "Discussion") {
    iconHtml = icons.discussion;
  } else {
    iconHtml = icons.default;
  }

  const formattedReason = notification.reason.replace(/_/g, ' ');

  notificationElement.innerHTML = `
    <div class="info">
      <div class="title">
        ${iconHtml}
        <h3>${notification.subject.title}</h3>
      </div>
      <div class="details">
        <p class="repository-name">${notification.repository.full_name}</p>
        <!-- <p class="notification-type">${notification.subject.type}</p> -->
        <p class="notification-reason">${formattedReason}</p>
      </div>
    </div>
    <div class="status">${notification.unread ? "🔵" : ""}</div>
  `;

  notificationElement.addEventListener("click", () => {
    try {
      const notificationWrapper = notificationElement.parentElement;

      if (!notificationWrapper) {
        throw new Error("No notification container found");
      }

      Array.from(notificationWrapper.parentElement?.children || []).forEach((sibling) => {
        sibling.classList.remove("selected");
      });

      notificationWrapper.classList.add("selected");

      // Construct the correct HTML URL
      const htmlUrl = constructHtmlUrl(notification);

      // Open the constructed HTML URL in a new tab
      window.open(htmlUrl, "_blank");
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  });
}

function constructHtmlUrl(notification: GitHubNotification): string {
  const baseUrl = "https://github.com";
  const repoFullName = notification.repository.full_name;

  function getLastUrlSegment(url: string): string | null {
    const segments = url.split("/");
    return segments.length > 0 ? segments[segments.length - 1] : null;
  }

  try {
    const issueNumber = getLastUrlSegment(notification.subject.url);
    const prNumber = getLastUrlSegment(notification.subject.url);
    const commitSha = getLastUrlSegment(notification.subject.url);
    const tagName = getLastUrlSegment(notification.subject.url);

    let commentId;

    if (notification.subject.latest_comment_url) {
      commentId = getLastUrlSegment(notification.subject.latest_comment_url);
    }

    let url = `${baseUrl}/${repoFullName}`;

    switch (notification.subject.type) {
      case "Issue":
        if (!issueNumber) throw new Error("Invalid issue URL");
        url = `${url}/issues/${issueNumber}`;
        break;
      case "PullRequest":
        if (!prNumber) throw new Error("Invalid pull request URL");
        url = `${url}/pull/${prNumber}`;
        break;
      case "Commit":
        if (!commitSha) throw new Error("Invalid commit URL");
        url = `${url}/commit/${commitSha}`;
        break;
      case "Release":
        if (!tagName) throw new Error("Invalid release URL");
        url = `${url}/releases/tag/${tagName}`;
        break;
    }

    // Add comment hash if available
    if (commentId) {
      url += `#issuecomment-${commentId}`;
    }

    return url;
  } catch (error) {
    console.error("Error constructing HTML URL:", error);
    return `${baseUrl}/${repoFullName}`;
  }
}
