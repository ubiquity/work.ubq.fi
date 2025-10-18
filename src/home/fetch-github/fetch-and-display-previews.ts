import { GitHubIssue } from "../github-types";
import { taskManager } from "../home";
import { applyAvatarsToIssues, renderGitHubIssues } from "../rendering/render-github-issues";
import { renderOrgHeaderLabel } from "../rendering/render-org-header";
import { closeModal } from "../rendering/render-preview-modal";
import { filterIssuesByAvailability } from "../sorting/filter-issues-by-availability";
import { getLabelText } from "../sorting/label-utils";
import { filterIssuesBySearch } from "../sorting/filter-issues-by-search";
import { Sorting } from "../sorting/generate-sorting-buttons";
import { sortIssuesController } from "../sorting/sort-issues-controller";
import { checkCacheIntegrityAndSyncTasks } from "./cache-integrity";

type Options = {
  ordering: "normal" | "reverse";
};

// decide initial value based on URL
export let isFilteringAvailableIssues = new URLSearchParams(window.location.search).get("allIssues") === "true" ? false : true;

export function swapAvailabilityFilter() {
  isFilteringAvailableIssues = !isFilteringAvailableIssues;

  //url part
  const newURL = new URL(window.location.href);
  if (isFilteringAvailableIssues) {
    newURL.searchParams.delete("allIssues");
  } else {
    newURL.searchParams.set("allIssues", "true");
  }
  console.log(newURL.toString());
  window.history.replaceState({}, "", newURL.toString());
}

// start at view based on URL
let isProposalOnlyViewer = new URLSearchParams(window.location.search).get("proposal") === "true";

const viewToggle = document.getElementById("view-toggle") as HTMLInputElement;

if (isProposalOnlyViewer) {
  viewToggle.checked = true;
}

if (!viewToggle) {
  throw new Error("Could not find view toggle");
}

// if the Directory/Proposals toggle is clicked re-render the issues
viewToggle.addEventListener("click", () => {
  isProposalOnlyViewer = !isProposalOnlyViewer;

  // If you are in a preview, close it
  closeModal();
  void displayGitHubIssues();
});

function getProposalsOnlyFilter(getProposals: boolean) {
  return (issue: GitHubIssue) => {
    const labels = Array.isArray(issue?.labels) ? issue.labels : [];
    const hasPriceLabel = labels.some((label) => /^(Price:)\s*/.test(getLabelText(label)));

    return getProposals ? !hasPriceLabel : hasPriceLabel;
  };
}

function filterIssuesByOrganization(issues: GitHubIssue[]): GitHubIssue[] {
  // get organization name from first thing after / in URL
  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  const urlOrgName = pathSegments.length > 0 ? pathSegments[0] : null;

  //  if there is no organization name in the URL, return all issues
  if (!urlOrgName) return issues;

  // filter issues by matching the URL organization name with the issue's organization name
  const filteredIssues = issues.filter((issue) => {
    const [issueOrgName] = issue.repository_url.split("/").slice(-2);
    return issueOrgName === urlOrgName;
  });

  // if no issues match the organization, redirect to home
  if (filteredIssues.length === 0) {
    console.log(`No issues found for organization "${urlOrgName}". Redirecting to the home page.`);
    window.location.href = "/";
  }

  renderOrgHeaderLabel(urlOrgName);

  return filteredIssues;
}

// checks the cache's integrity, sorts issues, checks Directory/Proposals toggle, renders them and applies avatars
export async function displayGitHubIssues({
  sorting,
  options = { ordering: "normal" },
  skipAnimation = false,
}: {
  sorting?: Sorting;
  options?: { ordering: string };
  skipAnimation?: boolean;
} = {}) {
  await checkCacheIntegrityAndSyncTasks();
  const cachedTasks = taskManager.getTasks();
  const sortedIssues = sortIssuesController(cachedTasks, sorting, options);
  let sortedAndFiltered = sortedIssues.filter(getProposalsOnlyFilter(isProposalOnlyViewer));
  sortedAndFiltered = filterIssuesByOrganization(sortedAndFiltered);
  sortedAndFiltered = isFilteringAvailableIssues ? filterIssuesByAvailability(sortedAndFiltered) : sortedAndFiltered;
  renderGitHubIssues(sortedAndFiltered, skipAnimation);
  applyAvatarsToIssues();
}

export async function searchDisplayGitHubIssues({ searchText, skipAnimation = false }: { searchText: string; skipAnimation?: boolean }) {
  const searchResult = filterIssuesBySearch(searchText);
  let filteredIssues = searchResult.filter(getProposalsOnlyFilter(isProposalOnlyViewer));
  filteredIssues = filterIssuesByOrganization(filteredIssues);
  filteredIssues = isFilteringAvailableIssues ? filterIssuesByAvailability(filteredIssues) : filteredIssues;
  renderGitHubIssues(filteredIssues, skipAnimation);
  applyAvatarsToIssues();
}
