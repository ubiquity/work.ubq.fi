import { GitHubIssue } from "../github-types";
import { calculateTimeLabelValue } from "./calculate-time-label-value";
import { getLabelText } from "./label-utils";

export function sortIssuesByTime(tasks: GitHubIssue[]) {
  return tasks.sort((a, b) => {
    const sumTime = (labels: GitHubIssue["labels"]) =>
      labels.reduce((acc, label) => {
        const text = getLabelText(label);
        return acc + (text.startsWith("Time: ") ? calculateTimeLabelValue(text) : 0);
      }, 0);

    return sumTime(b.labels) - sumTime(a.labels);
  });
}
