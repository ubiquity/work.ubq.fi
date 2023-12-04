import { Octokit } from "@octokit/rest";
import { GitHubIssue } from "./github-types";
import { homeController } from "./home-controller";

export type GitHubIssueWithNewFlag = GitHubIssue & { isNew?: boolean };

export async function displayGitHubIssues(accessToken: string | null) {
  const container = document.getElementById("issues-container") as HTMLDivElement;
  if (!container) {
    throw new Error("Could not find issues container");
  }
  await fetchIssues(container, accessToken);
}

function sortIssuesByPriority(issues: GitHubIssue[]) {
  return issues.sort((a, b) => {
    const priorityRegex = /Priority: (\d+)/;
    const aPriorityMatch = a.labels.find((label) => priorityRegex.test(label.name));
    const bPriorityMatch = b.labels.find((label) => priorityRegex.test(label.name));
    const aPriority = aPriorityMatch ? parseInt(aPriorityMatch.name.match(priorityRegex)![1], 10) : 0;
    const bPriority = bPriorityMatch ? parseInt(bPriorityMatch.name.match(priorityRegex)![1], 10) : 0;
    return bPriority - aPriority;
  });
}

function sortIssuesByTime(issues: GitHubIssue[]) {
  return issues.sort((a, b) => {
    const aTimeValue = a.labels.reduce((acc, label) => acc + calculateLabelValue(label.name), 0);
    const bTimeValue = b.labels.reduce((acc, label) => acc + calculateLabelValue(label.name), 0);
    return bTimeValue - aTimeValue;
  });
}

export function calculateLabelValue(label: string): number {
  const matches = label.match(/\d+/);
  const number = matches && matches.length > 0 ? parseInt(matches[0]) || 0 : 0;
  if (label.toLowerCase().includes("priority")) return number;
  // throw new Error(`Label ${label} is not a priority label`);
  if (label.toLowerCase().includes("minute")) return number * 0.002;
  if (label.toLowerCase().includes("hour")) return number * 0.125;
  if (label.toLowerCase().includes("day")) return 1 + (number - 1) * 0.25;
  if (label.toLowerCase().includes("week")) return number + 1;
  if (label.toLowerCase().includes("month")) return 5 + (number - 1) * 8;
  return 0;
}

async function fetchIssues(container: HTMLDivElement, accessToken: string | null) {
  try {
    const cachedIssues = localStorage.getItem("githubIssues");

    if (cachedIssues) {
      try {
        const issues = JSON.parse(cachedIssues);
        const sortedIssuesByTime = sortIssuesByTime(issues);
        const sortedIssuesByPriority = sortIssuesByPriority(sortedIssuesByTime);
        await homeController(container, sortedIssuesByPriority);
      } catch (error) {
        console.error(error);
      }
    }

    const octokit = new Octokit({
      auth: accessToken,
    });

    try {
      const { data: rateLimit } = await octokit.request("GET /rate_limit");
      console.log("Rate limit remaining: ", rateLimit.rate.remaining);
    } catch (error) {
      console.error(error);
    }
    // Fetch fresh issues and mark them as new
    const freshIssues: GitHubIssue[] = await octokit.paginate("GET /repos/ubiquity/devpool-directory/issues", {
      state: "open",
    });
    const freshIssuesWithNewFlag = freshIssues.map((issue) => ({ ...issue, isNew: true })) as GitHubIssueWithNewFlag[];

    // Sort the fresh issues
    const sortedIssuesByTime = sortIssuesByTime(freshIssuesWithNewFlag);
    const sortedIssuesByPriority = sortIssuesByPriority(sortedIssuesByTime);

    // Pass the fresh issues to the homeController
    await homeController(container, sortedIssuesByPriority);

    // Remove the 'isNew' flag before saving to localStorage
    const issuesToSave = freshIssuesWithNewFlag.map(({ ...issue }) => {
      delete issue.isNew;
      return issue;
    });
    localStorage.setItem("githubIssues", JSON.stringify(issuesToSave));
  } catch (error) {
    console.error(error);
  }
}
