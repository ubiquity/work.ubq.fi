import { GitHubIssue } from "../github-types";

export function sortIssuesByPriority(issues: GitHubIssue[]) {
  const priorityRegex = /Priority: (\d+)/;

  return issues.sort((a, b) => {
    function getPriority(issue: GitHubIssue) {
      const priorityLabel = issue.labels.find(
        (label): label is { name: string } => typeof label === "object" && "name" in label && typeof label.name === "string" && priorityRegex.test(label.name)
      );
      const match = priorityLabel?.name.match(priorityRegex);
      return match ? parseInt(match[1], 10) : -1;
    }

    return getPriority(b) - getPriority(a);
  });
}
