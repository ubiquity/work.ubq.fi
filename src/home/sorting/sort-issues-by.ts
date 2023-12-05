import { GitHubIssue } from "../github-types";
import { sortIssuesByPrice } from "./sort-issues-by-price";
import { sortIssuesByPriority } from "./sort-issues-by-priority";
import { sortIssuesByTime } from "./sort-issues-by-time";

export function sortIssuesBy(issues: GitHubIssue[], sortBy: string) {
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
