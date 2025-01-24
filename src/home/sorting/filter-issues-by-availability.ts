import { GitHubIssue } from "../github-types";

export function filterIssuesByAvailability(issues: GitHubIssue[]) {
  return issues.filter((issue) => {
    if (issue.assignee) return false;
    return true;
  });
}
