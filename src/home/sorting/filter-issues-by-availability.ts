import { GitHubIssue } from "../github-types.ts";
import { isIssueAssigned } from "../utils/issue-utils.ts";

export function filterIssuesByAvailability(issues: GitHubIssue[]) {
  return issues.filter((issue) => !isIssueAssigned(issue));
}
