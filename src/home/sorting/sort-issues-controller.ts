import { GitHubIssue } from "../github-types";
import { sortIssuesBy } from "./sort-issues-by";
import { sortIssuesByPriority } from "./sort-issues-by-priority";
import { sortIssuesByTime } from "./sort-issues-by-time";
import { Sorting } from "./generate-sorting-buttons";

export function sortIssuesController(issues: GitHubIssue[], sorting?: Sorting) {
  let sortedIssues = issues;

  if (sorting) {
    sortedIssues = sortIssuesBy(sortedIssues, sorting);
  } else {
    const sortedIssuesByTime = sortIssuesByTime(sortedIssues);
    const sortedIssuesByPriority = sortIssuesByPriority(sortedIssuesByTime);
    sortedIssues = sortedIssuesByPriority;
  }
  return sortedIssues;
}
