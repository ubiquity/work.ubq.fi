import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "./get-github-access-token";
import { GitHubIssue as GitHubIssuePreview } from "./github-types";
import { fetchCachedIssuesFull } from "./home";
import { renderGitHubIssues } from "./render-github-issues";

export type GitHubIssueWithNewFlag = GitHubIssuePreview & { isNew?: boolean };

export const SORTING_OPTIONS = ["priority", "time", "price"] as const;
export type Sorting = (typeof SORTING_OPTIONS)[number];

export async function fetchGitHubIssues(sorting?: Sorting) {
  const container = document.getElementById("issues-container") as HTMLDivElement;
  if (!container) {
    throw new Error("Could not find issues container");
  }
  return await fetchIssues(container, sorting);
}

export function sortIssuesBy(issues: GitHubIssuePreview[], sortBy: string) {
  switch (sortBy) {
    case "priority":
      return sortIssuesByPriority(issues);
    case "time":
      return sortIssuesByTime(issues);
    case "price":
      return sortIssuesByPrice(issues);
    default:
      return issues;
  }
}

function sortIssuesByPriority(issues: GitHubIssuePreview[]) {
  return issues.sort((a, b) => {
    const priorityRegex = /Priority: (\d+)/;
    const aPriorityMatch = a.labels.find((label) => priorityRegex.test(label.name));
    const bPriorityMatch = b.labels.find((label) => priorityRegex.test(label.name));
    const aPriority = aPriorityMatch ? parseInt(aPriorityMatch.name.match(priorityRegex)![1], 10) : 0;
    const bPriority = bPriorityMatch ? parseInt(bPriorityMatch.name.match(priorityRegex)![1], 10) : 0;
    return bPriority - aPriority;
  });
}

function sortIssuesByTime(issues: GitHubIssuePreview[]) {
  return issues.sort((a, b) => {
    const aTimeValue = a.labels.reduce((acc, label) => acc + calculateLabelValue(label.name), 0);
    const bTimeValue = b.labels.reduce((acc, label) => acc + calculateLabelValue(label.name), 0);
    return bTimeValue - aTimeValue;
  });
}

function sortIssuesByPrice(issues: GitHubIssuePreview[]) {
  return issues.sort((a, b) => {
    const aPriceLabel = a.labels.find((label) => label.name.startsWith("Pricing: "));
    const bPriceLabel = b.labels.find((label) => label.name.startsWith("Pricing: "));
    const aPrice = aPriceLabel ? parseInt(aPriceLabel.name.match(/Pricing: (\d+)/)![1], 10) : 0;
    const bPrice = bPriceLabel ? parseInt(bPriceLabel.name.match(/Pricing: (\d+)/)![1], 10) : 0;
    return bPrice - aPrice;
  });
}

function calculateLabelValue(label: string): number {
  const matches = label.match(/\d+/);
  const number = matches && matches.length > 0 ? parseInt(matches[0]) || 0 : 0;

  if (label.toLowerCase().includes("minute")) return number * 0.002;
  if (label.toLowerCase().includes("hour")) return number * 0.125;
  if (label.toLowerCase().includes("day")) return 1 + (number - 1) * 0.25;
  if (label.toLowerCase().includes("week")) return number + 1;
  if (label.toLowerCase().includes("month")) return 5 + (number - 1) * 8;
  return 0;
}

async function fetchIssues(container: HTMLDivElement, sorting?: Sorting) {
  let issues;
  try {
    issues = fetchCachedPreviews();
    if (issues) {
      await displayIssues(issues, container, sorting);
      issues = await fetchNewIssues();
    } else {
      issues = await fetchNewIssues();
      await displayIssues(issues, container, sorting);
    }
    return issues;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function displayIssues(issues: GitHubIssueWithNewFlag[], container: HTMLDivElement, sorting?: Sorting) {
  let sortedIssues = issues;

  if (!sorting) {
    // Sort the fresh issues
    const sortedIssuesByTime = sortIssuesByTime(sortedIssues);
    const sortedIssuesByPriority = sortIssuesByPriority(sortedIssuesByTime);
    sortedIssues = sortedIssuesByPriority;
  } else {
    sortedIssues = sortIssuesBy(sortedIssues, sorting);
  }
  // Pass the fresh issues to the homeController
  if (container.classList.contains("ready")) {
    container.classList.remove("ready");
    container.innerHTML = "";
  }
  await renderGitHubIssues(container, sortedIssues);
}

async function fetchNewIssues(): Promise<GitHubIssueWithNewFlag[]> {
  const octokit = new Octokit({ auth: getGitHubAccessToken() });

  try {
    const { data: rateLimit } = await octokit.request("GET /rate_limit");
    console.log("Rate limit remaining: ", rateLimit.rate.remaining);
  } catch (error) {
    console.error(error);
  }
  // Fetch fresh issues and mark them as new
  const freshIssues: GitHubIssuePreview[] = await octokit.paginate("GET /repos/ubiquity/devpool-directory/issues", {
    state: "open",
  });
  const freshIssuesWithNewFlag = freshIssues.map((issue) => ({ ...issue, isNew: true })) as GitHubIssueWithNewFlag[];

  // Remove the 'isNew' flag before saving to localStorage
  const issuesToSave = freshIssuesWithNewFlag.map(({ ...issue }) => {
    delete issue.isNew;
    return issue;
  });
  localStorage.setItem("gitHubIssuePreviews", JSON.stringify(issuesToSave));
  return freshIssuesWithNewFlag;
}

export function fetchCachedPreviews(): GitHubIssuePreview[] | null {
  const cachedIssues = localStorage.getItem("gitHubIssuePreviews");
  if (cachedIssues) {
    try {
      return JSON.parse(cachedIssues);
    } catch (error) {
      console.error(error);
    }
  }
  return null;
}

const map = new Map();
const cachedIssuesFull = fetchCachedIssuesFull();
if (cachedIssuesFull) cachedIssuesFull.forEach((issue) => map.set(issue.id, issue));

export function getPreviewToFullMapping() {
  return map;
}

export async function fetchIssuesFull(cachedIssues: GitHubIssuePreview[]) {
  const authToken = getGitHubAccessToken();
  if (!authToken) throw new Error("No auth token found");
  console.trace(`fetching full issues`);
  const octokit = new Octokit({ auth: getGitHubAccessToken() });
  const downloaded: unknown[] = [];
  const urlPattern = /https:\/\/github\.com\/(?<org>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issue_number>\d+)/;
  for (const preview of cachedIssues) {
    const match = preview.body.match(urlPattern);
    if (!match || !match.groups) {
      console.error("Invalid issue body URL format");
      continue;
    }

    const { org, repo, issue_number } = match.groups;

    const { data: full } = await octokit.request("GET /repos/{org}/{repo}/issues/{issue_number}", { issue_number, repo, org });
    downloaded.push(full);
    map.set(preview.id, full);
    console.trace({ [preview.id]: full });
    document.querySelector(`[data-issue-id="${preview.id}"]`)?.setAttribute("data-full-id", full.id);
  }

  return downloaded;
}
