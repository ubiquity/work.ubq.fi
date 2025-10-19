import { GitHubIssue } from "../github-types";

export function filterIssuesByAvailability(issues: GitHubIssue[]) {
  return issues.filter((issue) => {
    const hasAssignees = Array.isArray(issue.assignees) && issue.assignees.length > 0;
    return !(issue.assigned === true || issue.assignee || hasAssignees);
  });
}
