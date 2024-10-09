import { checkCacheIntegrityAndSyncTasks } from "./cache-integrity";
import { GitHubIssue } from "../github-types";
import { taskManager } from "../home";
import { applyAvatarsToIssues, renderGitHubIssues } from "../rendering/render-github-issues";
import { Sorting } from "../sorting/generate-sorting-buttons";
import { sortIssuesController } from "../sorting/sort-issues-controller";
import { fetchAvatar } from "./fetch-avatar";

export type Options = {
  ordering: "normal" | "reverse";
};

let isProposalOnlyViewer = false;

export const viewToggle = document.getElementById("view-toggle") as HTMLInputElement;
if (!viewToggle) {
  throw new Error("Could not find view toggle");
}
viewToggle.addEventListener("click", () => {
  isProposalOnlyViewer = !isProposalOnlyViewer;
  void displayGitHubIssues();
});

export async function fetchAvatars() {
  const cachedTasks = taskManager.getTasks();

  // fetches avatar for each organization for each task, but fetchAvatar() will only fetch once per organization, remaining are returned from cache
  const avatarPromises = cachedTasks.map(async (task: GitHubIssue) => {
    const [orgName] = task.repository_url.split("/").slice(-2);
    if (orgName) {
      return fetchAvatar(orgName);
    }
    return Promise.resolve();
  });

  await Promise.allSettled(avatarPromises);
}

export async function displayGitHubIssues(sorting?: Sorting, options = { ordering: "normal" }) {
  await checkCacheIntegrityAndSyncTasks();
  const cachedTasks = taskManager.getTasks();
  const sortedIssues = sortIssuesController(cachedTasks, sorting, options);
  const sortedAndFiltered = sortedIssues.filter(getProposalsOnlyFilter(isProposalOnlyViewer));
  renderGitHubIssues(sortedAndFiltered);
  applyAvatarsToIssues();
}

function getProposalsOnlyFilter(getProposals: boolean) {
  return (issue: GitHubIssue) => {
    if (!issue?.labels) return false;

    const hasPriceLabel = issue.labels.some((label) => {
      if (typeof label === "string") return false;
      return label.name?.startsWith("Price: ") || label.name?.startsWith("Price: ");
    });

    return getProposals ? !hasPriceLabel : hasPriceLabel;
  };
}
