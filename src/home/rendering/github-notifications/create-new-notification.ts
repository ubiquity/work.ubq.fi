import { GitHubNotification } from "../../github-types";
import { setUpNotificationElement } from "./set-up-notification-element";

export function createNewNotification({ notification, container }: { notification: GitHubNotification; container: HTMLDivElement }) {
  const notificationWrapper = document.createElement("div");
  const notificationElement = document.createElement("div");
  notificationElement.setAttribute("data-notification-id", notification.id);
  notificationElement.classList.add("notification-element-inner");

  setUpNotificationElement(notificationElement, notification);
  notificationWrapper.appendChild(notificationElement);

  container.appendChild(notificationWrapper);
  return notificationWrapper;
}
