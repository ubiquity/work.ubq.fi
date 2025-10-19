import { GitHubIssue } from "../github-types.ts";
import { Sorting } from "./generate-sorting-buttons.ts";
import { sortIssuesBy } from "./sort-issues-by.ts";
import { sortIssuesByPriority } from "./sort-issues-by-priority.ts";
import { sortIssuesByTime } from "./sort-issues-by-time.ts";

export function sortIssuesController(tasks: GitHubIssue[], sorting?: Sorting, options = { ordering: "normal" }) {
  let sortedIssues = tasks;

  if (sorting) {
    sortedIssues = sortIssuesBy(sortedIssues, sorting);
  } else {
    const sortedIssuesByTime = sortIssuesByTime(sortedIssues);
    const sortedIssuesByPriority = sortIssuesByPriority(sortedIssuesByTime);
    sortedIssues = sortedIssuesByPriority;
  }

  if (options.ordering == "reverse") {
    sortedIssues = sortedIssues.reverse();
  }

  return sortedIssues;
}
