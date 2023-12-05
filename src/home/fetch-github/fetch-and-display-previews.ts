import { getLocalStore } from "../getters/get-local-store";
import { GitHubIssue } from "../github-types";
import { renderGitHubIssues } from "../rendering/render-github-issues";
import { Sorting } from "../sorting/generate-sorting-buttons";
import { sortIssuesController } from "../sorting/sort-issues-controller";
import { fetchIssuePreviews } from "./fetch-issues-preview";

export type Options = {
  ordering: "normal" | "reverse";
};

export async function fetchAndDisplayPreviews(sorting?: Sorting, options = { ordering: "normal" }) {
  const container = document.getElementById("issues-container") as HTMLDivElement;
  if (!container) {
    throw new Error("Could not find issues container");
  }
  let issues: null | GitHubIssue[] = null;
  issues = getLocalStore("gitHubIssuesPreview") as GitHubIssue[] | null;
  if (issues) {
    displayIssues(issues, container, sorting, options);
    issues = await fetchIssuePreviews();
  } else {
    issues = await fetchIssuePreviews();
    displayIssues(issues, container, sorting, options);
  }
  return issues;
}

function displayIssues(issues: GitHubIssue[], container: HTMLDivElement, sorting?: Sorting, options = { ordering: "normal" }) {
  const sortedIssues = sortIssuesController(issues, sorting, options);
  renderGitHubIssues(container, sortedIssues);
}
