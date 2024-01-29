import { TaskMaybeFull } from "../fetch-github/preview-to-full-mapping";

export function sortIssuesByPriority(issues: TaskMaybeFull[]) {
  return issues.sort((a, b) => {
    const priorityRegex = /Priority: (\d+)/;
    const aPriorityMatch = a.preview.labels.find((label) => priorityRegex.test(label.name));
    const bPriorityMatch = b.preview.labels.find((label) => priorityRegex.test(label.name));

    const priorityA = aPriorityMatch ? aPriorityMatch.name.match(priorityRegex) : null;
    const priorityB = bPriorityMatch ? bPriorityMatch.name.match(priorityRegex) : null;

    const aPriority = priorityA && priorityA[1] ? parseInt(priorityA[1], 10) : 0;
    const bPriority = priorityB && priorityB[1] ? parseInt(priorityB[1], 10) : 0;

    return bPriority - aPriority;
  });
}
