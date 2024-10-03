import { GitHubIssue } from "../github-types";

export function sortIssuesByPriority(issues: GitHubIssue[]) {
  return issues.sort((a, b) => {
    const priorityRegex = /Priority: (\d+)/;
    const aPriorityMatch =
      a.labels.find((label): label is { name: string } => typeof label === "object" && label !== null && "name" in label && priorityRegex.test(label.name))
        ?.name || "No Priority";
    const bPriorityMatch =
      b.labels.find((label): label is { name: string } => typeof label === "object" && label !== null && "name" in label && priorityRegex.test(label.name))
        ?.name || "No Priority";

    const priorityA = aPriorityMatch.match(priorityRegex);
    const priorityB = bPriorityMatch.match(priorityRegex);

    const aPriority = priorityA && priorityA[1] ? parseInt(priorityA[1], 10) : 0;
    const bPriority = priorityB && priorityB[1] ? parseInt(priorityB[1], 10) : 0;

    return bPriority - aPriority;
  });
}
