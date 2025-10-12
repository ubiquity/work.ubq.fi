import { GitHubIssue } from "../github-types";

export function filterIssuesByAvailability(issues: GitHubIssue[]) {
  return issues.filter((issue) => {
    // v2 backend: prefer explicit `assigned` from mirror-state
    if (issue.assigned === true) return false;
    // Fallback: Treat either a non-null assignee or non-empty assignees array as unavailable
    if (issue.assignee) return false;
    if (Array.isArray(issue.assignees) && issue.assignees.length > 0) return false;
    return true;
  });
}
