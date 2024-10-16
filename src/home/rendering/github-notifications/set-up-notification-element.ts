import { GitHubNotification } from "../../github-types";
import icons from "../icons/notification-icons";
import { constructHtmlUrl } from "./constructi-html-url";

export function setUpNotificationElement(notificationElement: HTMLDivElement, notification: GitHubNotification) {
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

  const formattedReason = notification.reason.replace(/_/g, " ");
  notificationElement.innerHTML = `
    <div class="info">
      <div class="title">
        ${iconHtml}
        <h3>${notification.subject.title}</h3>
      </div>
      <div class="details">
        <p class="repository-name">${notification.repository.full_name}</p>
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
