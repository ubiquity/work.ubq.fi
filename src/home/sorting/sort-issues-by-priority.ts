import { GitHubIssue } from "../github-types";

export function sortIssuesByPriority(issues: GitHubIssue[]) {
  const priorityRegex = /Priority: (\d+)/;

  return issues.sort((a, b) => {
    function getPriority(issue: GitHubIssue) {
      // Try object labels
      const objectLabel = issue.labels.find((l) => typeof l === "object" && "name" in l && typeof (l as any).name === "string" && priorityRegex.test((l as any).name as string)) as
        | { name: string }
        | undefined;
      const objectMatch = objectLabel?.name.match(priorityRegex);
      if (objectMatch) return parseInt(objectMatch[1], 10);

      // Fallback to string labels
      const stringLabel = issue.labels.find((l) => typeof l === "string" && priorityRegex.test(l as string)) as string | undefined;
      const stringMatch = stringLabel?.match(priorityRegex);
      return stringMatch ? parseInt(stringMatch[1], 10) : -1;
    }

    return getPriority(b) - getPriority(a);
  });
}
