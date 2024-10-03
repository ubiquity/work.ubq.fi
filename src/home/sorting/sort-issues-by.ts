import { GitHubIssue } from "../github-types";
import { SORTING_OPTIONS } from "./generate-sorting-buttons";
import { sortIssuesByPrice } from "./sort-issues-by-price";
import { sortIssuesByPriority } from "./sort-issues-by-priority";
import { sortIssuesByTime } from "./sort-issues-by-time";
import { sortIssuesByLatestActivity } from "./sort-issues-by-updated-time";

export function sortIssuesBy(tasks: GitHubIssue[], sortBy: (typeof SORTING_OPTIONS)[number]) {
  switch (sortBy) {
    case "priority":
      return sortIssuesByPriority(tasks);
    case "time":
      return sortIssuesByTime(tasks);
    case "price":
      return sortIssuesByPrice(tasks);
    case "activity":
      return sortIssuesByLatestActivity(tasks);
    default:
      return tasks;
  }
}
