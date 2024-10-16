import { setUpNotificationElement } from "./set-up-notification-element";
import { EnrichedGitHubNotification } from "./render-github-notifications";

export function createNewNotification({ notification, container }: { notification: EnrichedGitHubNotification; container: HTMLElement }) {
  const notificationWrapper = document.createElement("div");
  const notificationElement = document.createElement("div");
  notificationElement.setAttribute("data-notification-id", notification.id);
  notificationElement.classList.add("notification-element-inner");

  const link = document.createElement("a");
  link.href = notification.subject.url.replace("api.github.com/repos", "github.com").replace("/pulls/", "/pull/");
  link.appendChild(notificationElement);

  setUpNotificationElement(notificationElement, notification);
  notificationWrapper.appendChild(link);
  container.appendChild(notificationWrapper);
  return notificationWrapper;
}
