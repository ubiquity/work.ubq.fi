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

void (async function home() {
  void authentication();
  void readyToolbar();
  const previews = await fetchAndDisplayPreviewsFromCache();
  const full = await fetchIssuesFull(previews);
  taskManager.addTasks(full);
  return full;
})();
