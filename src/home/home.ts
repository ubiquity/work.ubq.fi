import { grid } from "../the-grid";
import { initiateDevRelTracking } from "./devrel-tracker";
import main from "./main";
import { NotificationManager } from "./notification-manager";
import { registerServiceWorker } from "./register-service-worker";
import { renderServiceMessage } from "./render-service-message";
import { renderErrorInModal } from "./rendering/display-popup-modal";
import { renderGitRevision } from "./rendering/render-github-login-button";
import { generateSortingToolbar } from "./sorting/generate-sorting-buttons";
import { TaskManager } from "./task-manager";

const container = document.getElementById("issues-container") as HTMLDivElement;

if (!container) {
  throw new Error("Could not find issues container");
}

renderGitRevision();
initiateDevRelTracking();
generateSortingToolbar();
renderServiceMessage();
grid(document.getElementById("grid") as HTMLElement, () => document.body.classList.add("grid-loaded")); // @DEV: display grid background

export const taskManager = new TaskManager(container);
export const notificationManager = new NotificationManager(container);

// All unhandled errors are caught and displayed in a modal
window.addEventListener("error", (event: ErrorEvent) => renderErrorInModal(event.error));

// All unhandled promise rejections are caught and displayed in a modal
window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
  renderErrorInModal(event.reason as Error);
  event.preventDefault();
});

if ("serviceWorker" in navigator) {
  registerServiceWorker();
}

main().catch((error) => renderErrorInModal(error));
