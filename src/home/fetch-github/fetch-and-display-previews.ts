import { GitHubIssue } from "../github-types";
import { taskManager } from "../home";
import { applyAvatarsToIssues, renderGitHubIssues } from "../rendering/render-github-issues";
import { Sorting } from "../sorting/generate-sorting-buttons";
import { sortIssuesController } from "../sorting/sort-issues-controller";
import { checkCacheIntegrityAndSyncTasks } from "./cache-integrity";

// import NOTIFICATIONS_EXAMPLE from "./fixtures/notifications-example";
import { renderGitHubNotifications } from "../rendering/github-notifications/render-github-notifications";

export type Options = {
  ordering: "normal" | "reverse";
};

type ViewState = "directory" | "proposals" | "notifications";

// start at Directory view
let currentViewState: ViewState = "directory";

const radioButtons = [
  document.getElementById("radio-directory") as HTMLInputElement,
  document.getElementById("radio-proposals") as HTMLInputElement,
  document.getElementById("radio-notifications") as HTMLInputElement,
];

const viewToggleLabel = document.querySelector('label[for="view-toggle"]') as HTMLLabelElement;
const viewToggleText = document.getElementById("view-toggle-text") as HTMLSpanElement;

if (!radioButtons.every(Boolean) || !viewToggleLabel || !viewToggleText) {
  console.error("One or more view toggle elements not found");
}

function updateView() {
  const checkedRadio = radioButtons.find((radio) => radio.checked);
  if (checkedRadio) {
    viewToggleText.textContent = checkedRadio.id.replace("radio-", "").charAt(0).toUpperCase() + checkedRadio.id.replace("radio-", "").slice(1);
    currentViewState = checkedRadio.id.replace("radio-", "") as ViewState;
    void displayGitHubIssues();
  }
}

function cycleRadioButtons() {
  const currentIndex = radioButtons.findIndex((radio) => radio.checked);
  const nextIndex = (currentIndex + 1) % radioButtons.length;
  radioButtons[nextIndex].checked = true;
  updateView();
}

viewToggleLabel.addEventListener("click", (event) => {
  event.preventDefault(); // Prevent default label behavior
  cycleRadioButtons();
});

// Initialize the view
// updateView();

function getViewFilter(viewState: ViewState) {
  return (issue: GitHubIssue) => {
    if (!issue?.labels) return false;

    const hasPriceLabel = issue.labels.some((label) => {
      if (typeof label === "string") return false;
      return label.name?.startsWith("Price: ");
    });

    switch (viewState) {
      case "directory":
        return hasPriceLabel;
      case "proposals":
        return !hasPriceLabel;
      case "notifications":
        console.trace("Notification view time");
        return false; // We'll load a separate JSON for notifications
      default:
        return false;
    }
  };
}

// checks the cache's integrity, sorts issues, applies view filter, renders them and applies avatars
export async function displayGitHubIssues(sorting?: Sorting, options = { ordering: "normal" }) {
  await checkCacheIntegrityAndSyncTasks().catch(console.error);
  const cachedTasks = taskManager.getTasks();
  const sortedIssues = sortIssuesController(cachedTasks, sorting, options);
  if (currentViewState === "notifications") {
    await renderGitHubNotifications();
  } else {
    const filteredIssues = sortedIssues.filter(getViewFilter(currentViewState));
    renderGitHubIssues(filteredIssues);
    applyAvatarsToIssues();
  }
}
