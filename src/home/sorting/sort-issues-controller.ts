import { GitHubIssue } from "../github-types";
import { Sorting } from "./generate-sorting-buttons";
import { sortIssuesBy } from "./sort-issues-by";
import { sortIssuesByPriority } from "./sort-issues-by-priority";
import { sortIssuesByTime } from "./sort-issues-by-time";

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
