import { grid } from "../the-grid";
import { authentication } from "./authentication";
import { fetchAndDisplayPreviewsFromCache } from "./fetch-github/fetch-and-display-previews";
import { fetchIssuesFull } from "./fetch-github/fetch-issues-full";
import { readyToolbar } from "./ready-toolbar";
import { generateSortingToolbar } from "./sorting/generate-sorting-buttons";
import { TaskManager } from "./task-manager";

generateSortingToolbar();
grid(document.getElementById("grid") as HTMLElement);
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
    taskManager.writeToStorage();
    return fullTasks;
  } catch (error) {
    console.error(error);
  }

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
