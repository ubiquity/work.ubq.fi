import { grid } from "../the-grid";
import { authentication } from "./authentication";
import { initiateDevRelTracking } from "./devrel-tracker";
import { fetchAndDisplayPreviewsFromCache } from "./fetch-github/fetch-and-display-previews";
import { fetchIssuesFull } from "./fetch-github/fetch-issues-full";
import { readyToolbar } from "./ready-toolbar";
import { showError } from "./rendering/display-popup-modal";
import { generateSortingToolbar } from "./sorting/generate-sorting-buttons";
import { TaskManager } from "./task-manager";

initiateDevRelTracking();
generateSortingToolbar();
renderServiceMessage();
grid(document.getElementById("grid") as HTMLElement, () => document.body.classList.add("grid-loaded")); // @DEV: display grid background
const container = document.getElementById("issues-container") as HTMLDivElement;

if (!container) {
  throw new Error("Could not find issues container");
}

export const taskManager = new TaskManager(container);
// window["taskManager"] = taskManager;

void (async function home() {
  try {
    void authentication();
    void readyToolbar();
    const previews = await fetchAndDisplayPreviewsFromCache();
    const fullTasks = await fetchIssuesFull(previews);
    taskManager.syncTasks(fullTasks);
    console.trace({ fullTasks });
    await taskManager.writeToStorage();
    return fullTasks;
  } catch (error) {
    showError(`${error}`, false)
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/dist/src/progressive-web-app.js").then(
        (registration) => {
          console.log("ServiceWorker registration successful with scope: ", registration.scope);
        },
        (err) => {
          showError(`${err}`, false, "ServiceWorker registration failed: ")
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
