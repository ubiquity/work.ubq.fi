import { getLocalStore } from "../get-local-store";
import { GitHubIssue } from "../github-types";
import { renderGitHubIssues } from "../render-github-issues";
import { Sorting } from "../sorting/generate-sorting-buttons";
import { sortIssuesController } from "../sorting/sort-issues-controller";
import { fetchIssuePreviews } from "./fetch-issues-preview";

export async function fetchAndDisplayIssuesCacheOrRemote(sorting?: Sorting) {
  const container = document.getElementById("issues-container") as HTMLDivElement;
  if (!container) {
    throw new Error("Could not find issues container");
  }
  let issues: null | GitHubIssue[] = null;
  issues = getLocalStore("gitHubIssuePreviews") as GitHubIssue[];
  if (issues) {
    displayIssues(issues, container, sorting);
    issues = await fetchIssuePreviews();
  } else {
    issues = await fetchIssuePreviews();
    displayIssues(issues, container, sorting);
  }
  return issues;
}

function displayIssues(issues: GitHubIssue[], container: HTMLDivElement, sorting?: Sorting) {
  const sortedIssues = sortIssuesController(issues, sorting);
  renderGitHubIssues(container, sortedIssues);
}
