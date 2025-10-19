import { GitHubIssue } from "../github-types";
import { getLabelText } from "./label-utils";

export function sortIssuesByPriority(issues: GitHubIssue[]) {
  const priorityRegex = /Priority: (\d+)/;

  return issues.sort((a, b) => {
    function getPriority(issue: GitHubIssue) {
      for (const label of issue.labels) {
        const text = getLabelText(label);
        if (!text) continue;
        const match = text.match(priorityRegex);
        if (match) return parseInt(match[1], 10);
      }
      return -1;
    }

    return getPriority(b) - getPriority(a);
  });
}
