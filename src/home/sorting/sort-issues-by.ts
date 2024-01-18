import { GitHubIssue } from "../github-types";
import { SORTING_OPTIONS } from "./generate-sorting-buttons";
import { sortIssuesByPrice } from "./sort-issues-by-price";
import { sortIssuesByPriority } from "./sort-issues-by-priority";
import { sortIssuesByTime } from "./sort-issues-by-time";
import { sortIssuesByLatestActivity } from "./sort-issues-by-updated-time";

export function sortIssuesBy(issues: GitHubIssue[], sortBy: typeof SORTING_OPTIONS[number]) {
  switch (sortBy) {
    case "priority":
      return sortIssuesByPriority(issues);
    case "time":
      return sortIssuesByTime(issues);
    case "price":
      return sortIssuesByPrice(issues);
    case "activity":
      return sortIssuesByLatestActivity(issues);
    default:
      return issues;
  }
}
