import { grid } from "../the-grid";
import { authentication } from "./authentication";
import { initiateDevRelTracking } from "./devrel-tracker";
import { fetchAndDisplayPreviewsFromCache } from "./fetch-github/fetch-and-display-previews";
import { fetchIssuesFull } from "./fetch-github/fetch-issues-full";
import { readyToolbar } from "./ready-toolbar";
import { renderErrorInModal, displayPopupMessage } from "./rendering/display-popup-modal";
import { generateSortingToolbar } from "./sorting/generate-sorting-buttons";
import { TaskManager } from "./task-manager";

// All unhandled errors are caught and displayed in a modal
window.addEventListener("error", (event: ErrorEvent) => renderErrorInModal(event.error));

// All unhandled promise rejections are caught and displayed in a modal
window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
  renderErrorInModal(event.reason as Error);
  event.preventDefault();
});

initiateDevRelTracking();
generateSortingToolbar();
renderServiceMessage();

grid(document.getElementById("grid") as HTMLElement, () => document.body.classList.add("grid-loaded")); // @DEV: display grid background
const container = document.getElementById("issues-container") as HTMLDivElement;

if (!container) {
  throw new Error("Could not find issues container");
}

export const taskManager = new TaskManager(container);

async function loadIssues() {
  try {
    // First, try to get issues from cache
    const cache = await caches.open("devpool-directory-cache-v1");
    const cachedResponse = await cache.match("/api/issues");

    if (cachedResponse) {
      const cachedIssues = await cachedResponse.json();
      taskManager.syncTasks(cachedIssues);
      displayPopupMessage({ modalHeader: "Loaded cached issues", modalBody: "Fetching latest updates...", isError: false });
    }

    // Then, fetch fresh issues
    const previews = await fetchAndDisplayPreviewsFromCache();
    const freshIssues = await fetchIssuesFull(previews);
    taskManager.syncTasks(freshIssues);
    await taskManager.writeToStorage();

    // Update the cache with fresh issues
    await cache.put("/api/issues", new Response(JSON.stringify(freshIssues)));

    // Request a background sync
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register("sync-issues");
    }

    displayPopupMessage({ modalHeader: "Issues updated", modalBody: "Latest issues have been loaded and cached.", isError: false });
  } catch (error) {
    console.error("Failed to fetch fresh issues:", error);
    renderErrorInModal(error as Error);
  }
}

void (async function home() {
  void authentication();
  void readyToolbar();
  await loadIssues();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/dist/src/progressive-web-app.js").then(
        (registration) => {
          console.log("ServiceWorker registration successful with scope: ", registration.scope);
        },
        (err) => {
          console.log("ServiceWorker registration failed: ", err);
        }
      );
    });
  }
})();

function renderServiceMessage() {
  const urlParams = new URLSearchParams(window.location.search);
  const message = urlParams.get("message");
  if (message) {
    const serviceMessageContainer = document.querySelector("#bottom-bar > div");
    if (serviceMessageContainer) {
      serviceMessageContainer.textContent = message;
      serviceMessageContainer.parentElement?.classList.add("ready");
    }
  }
}
