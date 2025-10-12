import { GitHubIssue } from "../github-types";

export function filterIssuesByAvailability(issues: GitHubIssue[]) {
  return issues.filter((issue) => {
    // Treat either a non-null assignee or non-empty assignees array as unavailable
    if (issue.assignee) return false;
    if (Array.isArray((issue as any).assignees) && (issue as any).assignees.length > 0) return false;
    return true;
  });
}
