import { GitHubIssue } from "../github-types.ts";
import { taskManager } from "../home.ts";
import { applyAvatarsToIssues, renderGitHubIssues } from "../rendering/render-github-issues.ts";
import { renderOrgHeaderLabel } from "../rendering/render-org-header.ts";
import { closeModal } from "../rendering/render-preview-modal.ts";
import { filterIssuesByAvailability, isAvailabilityFilterEnabled } from "../sorting/filter-issues-by-availability.ts";
import { getLabelText } from "../sorting/label-utils.ts";
import { filterIssuesBySearch } from "../sorting/filter-issues-by-search.ts";
import { Sorting } from "../sorting/generate-sorting-buttons.ts";
import { sortIssuesController } from "../sorting/sort-issues-controller.ts";
import { StartEligibilityFilter } from "../sorting/filter-issues-by-start-eligibility.ts";
import { checkSupabaseSession } from "../rendering/render-github-login-button.ts";
import { checkCacheIntegrityAndSyncTasks } from "./cache-integrity.ts";

declare const COMMAND_START_STOP_URL: string; // Injected at build time; public /start endpoint, never a secret.
const eligibilityFilter = new StartEligibilityFilter(COMMAND_START_STOP_URL);
let latestRender = 0;

type Options = {
  ordering: "normal" | "reverse";
};

// decide initial value based on URL
export let isFilteringAvailableIssues = isAvailabilityFilterEnabled(globalThis.location?.search ?? "");

export function swapAvailabilityFilter() {
  isFilteringAvailableIssues = !isFilteringAvailableIssues;

  //url part
  const href = globalThis.location?.href ?? "";
  const newURL = new URL(href || "http://localhost/");
  if (isFilteringAvailableIssues) {
    newURL.searchParams.delete("allIssues");
  } else {
    newURL.searchParams.set("allIssues", "true");
  }
  console.log(newURL.toString());
  globalThis.history?.replaceState({}, "", newURL.toString());
}

// start at view based on URL
let isProposalOnlyViewer = new URLSearchParams(globalThis.location?.search ?? "").get("proposal") === "true";

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
    const hasPriceLabel = issue.labels.some((label) => /^Price:\s*/.test(getLabelText(label)));

    return getProposals ? !hasPriceLabel : hasPriceLabel;
  };
}

function filterIssuesByOrganization(issues: GitHubIssue[]): GitHubIssue[] {
  // get organization name from first thing after / in URL
  const pathSegments = (globalThis.location?.pathname ?? "/").split("/").filter(Boolean);
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
    if (globalThis.location) globalThis.location.href = "/";
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
  options?: Options;
  skipAnimation?: boolean;
} = {}) {
  const renderId = ++latestRender;
  await checkCacheIntegrityAndSyncTasks();
  if (renderId !== latestRender) return;
  const cachedTasks = taskManager.getTasks();
  const sortedIssues = sortIssuesController(cachedTasks, sorting, options);
  await filterAndRenderIssues(sortedIssues, skipAnimation, renderId);
}

export async function searchDisplayGitHubIssues({ searchText, skipAnimation = false }: { searchText: string; skipAnimation?: boolean }) {
  const renderId = ++latestRender;
  await filterAndRenderIssues(filterIssuesBySearch(searchText), skipAnimation, renderId);
}

async function filterAndRenderIssues(issues: GitHubIssue[], skipAnimation: boolean, renderId: number) {
  let filteredIssues = issues.filter(getProposalsOnlyFilter(isProposalOnlyViewer));
  filteredIssues = filterIssuesByOrganization(filteredIssues);
  if (isFilteringAvailableIssues) filteredIssues = filterIssuesByAvailability(filteredIssues);

  let message = "";
  if (isFilteringAvailableIssues && !isProposalOnlyViewer) {
    try {
      const session = await checkSupabaseSession();
      if (renderId !== latestRender) return;
      if (!session?.access_token || !session?.provider_token) {
        message = "Log in with GitHub to see which unassigned tasks you can start.";
      } else if (!COMMAND_START_STOP_URL) {
        message = "Task eligibility checks are not configured. Showing unassigned tasks only.";
      } else {
        renderEligibilityStatus("Checking which tasks you can start…");
        const result = await eligibilityFilter.filter(filteredIssues, { userId: session.user.id, accessToken: session.access_token });
        filteredIssues = result.issues;
        if (result.uncheckedCount) {
          message = `Eligibility could not be verified for ${result.uncheckedCount} tasks. Try again shortly or choose All Issues.`;
        }
      }
    } catch {
      // Do not present unchecked tasks as startable if authentication/checking fails.
      filteredIssues = [];
      message = "Task eligibility could not be checked. Log in again or choose All Issues.";
    }
  }

  // Search, sort and view changes can overtake a pending eligibility request.
  if (renderId !== latestRender) return;
  renderGitHubIssues(filteredIssues, skipAnimation);
  if (!filteredIssues.length && !message) message = "No tasks match your filters. Try another search or choose All Issues.";
  renderEligibilityStatus(message);
  applyAvatarsToIssues();
}

function renderEligibilityStatus(message: string) {
  const container = taskManager.getContainer();
  let status = container.querySelector<HTMLParagraphElement>("#eligibility-status");
  if (!status && message) {
    status = document.createElement("p");
    status.id = "eligibility-status";
    status.setAttribute("role", "status");
    container.prepend(status);
  }
  if (status) status.textContent = message;
}
