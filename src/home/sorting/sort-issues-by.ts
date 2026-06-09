import { GitHubIssue } from "../github-types.ts";
import { SORTING_OPTIONS } from "./generate-sorting-buttons.ts";
import { sortIssuesByMatch } from "../matching/sort-issues-by-match.ts";
import { sortIssuesByPrice } from "./sort-issues-by-price.ts";
import { sortIssuesByPriority } from "./sort-issues-by-priority.ts";
import { sortIssuesByTime } from "./sort-issues-by-time.ts";
import { sortIssuesByLatestActivity } from "./sort-issues-by-updated-time.ts";

export function sortIssuesBy(tasks: GitHubIssue[], sortBy: (typeof SORTING_OPTIONS)[number]) {
  switch (sortBy) {
    case "match":
      return sortIssuesByMatch(tasks);
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
