import { GitHubIssue } from "../github-types";

export function sortIssuesByLatestActivity(issues: GitHubIssue[], ordering: "normal" | "reverse" = "normal") {
  return issues.sort((a, b) => {
    const dateA = new Date(a.updated_at);
    const dateB = new Date(b.updated_at);
    return ordering === "normal" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
  });
}
