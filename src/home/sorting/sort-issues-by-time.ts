import { GitHubIssue } from "../github-types.ts";
import { calculateTimeLabelValue } from "./calculate-time-label-value.ts";
import { getLabelText } from "./label-utils.ts";

export function sortIssuesByTime(tasks: GitHubIssue[]) {
  return tasks.sort((a, b) => sumTime(b.labels) - sumTime(a.labels));
}

function sumTime(labels: GitHubIssue["labels"]): number {
  return labels.reduce((acc, label) => {
    const text = getLabelText(label);
    return acc + (text.startsWith("Time: ") ? calculateTimeLabelValue(text) : 0);
  }, 0);
}
