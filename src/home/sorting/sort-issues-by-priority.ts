import { GitHubIssue } from "../github-types";

// Type guard for label objects with a name
function isNamedLabel(l: unknown): l is { name: string } {
  if (typeof l !== "object" || l === null) return false;
  const obj = l as Record<string, unknown>;
  return typeof obj.name === "string";
}

export function sortIssuesByPriority(issues: GitHubIssue[]) {
  const priorityRegex = /Priority: (\d+)/;

  return issues.sort((a, b) => {
    function getPriority(issue: GitHubIssue) {
      // Try object labels
      const objectLabel = issue.labels.find((l): l is { name: string } => isNamedLabel(l) && priorityRegex.test(l.name));
      const objectMatch = objectLabel?.name.match(priorityRegex);
      if (objectMatch) return parseInt(objectMatch[1], 10);

      // Fallback to string labels
      const stringLabel = issue.labels.find((l): l is string => typeof l === "string" && priorityRegex.test(l));
      const stringMatch = stringLabel?.match(priorityRegex);
      return stringMatch ? parseInt(stringMatch[1], 10) : -1;
    }

    return getPriority(b) - getPriority(a);
  });
}
