import { grid } from "../the-grid.ts";
import { authentication } from "./authentication.ts";
import { displayGitHubIssues } from "./fetch-github/fetch-and-display-previews.ts";
import { postLoadUpdateIssues } from "./fetch-github/fetch-issues-full.ts";
import { readyToolbar } from "./ready-toolbar.ts";
import { initiateReferralCodeTracking } from "./register-referral.ts";
import { renderServiceMessage } from "./render-service-message.ts";
import { renderErrorInModal } from "./rendering/display-popup-modal.ts";
import { loadIssueFromUrl } from "./rendering/render-github-issues.ts";
import { renderGitRevision } from "./rendering/render-github-login-button.ts";
import { generateSortingToolbar } from "./sorting/generate-sorting-buttons.ts";
import { TaskManager } from "./task-manager.ts";

// All unhandled errors are caught and displayed in a modal
window.addEventListener("error", (event: ErrorEvent) => renderErrorInModal(event.error));

// All unhandled promise rejections are caught and displayed in a modal
window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
  renderErrorInModal(event.reason as Error);
  event.preventDefault();
});

initiateReferralCodeTracking();
renderGitRevision();
generateSortingToolbar();
renderServiceMessage();

grid(document.getElementById("grid") as HTMLElement, () => document.body.classList.add("grid-loaded")); // @DEV: display grid background
const container = document.getElementById("issues-container") as HTMLDivElement;

if (!container) {
  throw new Error("Could not find issues container");
}

export const taskManager = new TaskManager(container);

void (async function home() {
  void authentication();
  void readyToolbar();
  await taskManager.syncTasks(); // Sync tasks from cache on load
  await loadIssueFromUrl(); // Load issue preview from URL if present
  void displayGitHubIssues(); // Display issues from cache
  await postLoadUpdateIssues(); // Update cache and issues if cache is outdated

  // Register service worker for PWA
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/progressive-web-app.js")
      .then(() => {
        console.log("Service worker registered");
      })
      .catch((err) => {
        console.log(err);
      });
  }
})();
