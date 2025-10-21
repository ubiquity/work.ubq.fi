import { GitHubIssue } from "../github-types.ts";

export function isIssueAssigned(issue: GitHubIssue): boolean {
  if (issue.assigned === true) return true;
  if (issue.assignee) return true;
  if (Array.isArray(issue.assignees) && issue.assignees.length > 0) return true;
  return false;
}
