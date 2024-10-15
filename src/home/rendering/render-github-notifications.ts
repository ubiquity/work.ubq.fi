import { taskManager } from "../home";
import { setupKeyboardNavigation } from "./setup-keyboard-navigation";

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
  notificationElement.innerHTML = `
    <div class="info">
      <div class="title"><h3>${notification.subject.title}</h3></div>
      <div class="details">
        <p class="repository-name">${notification.repository.full_name}</p>
        <p class="notification-type">${notification.subject.type}</p>
        <p class="notification-reason">${notification.reason}</p>
      </div>
    </div>
    <div class="status">${notification.unread ? "Unread" : "Read"}</div>
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

      // Open the notification URL in a new tab
      window.open(notification.subject.url, "_blank");
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  });
}

// ... You can add more helper functions here if needed
