import { GitHubIssue } from "../github-types";
import { calculateTimeLabelValue } from "./calculate-time-label-value";

export function sortIssuesByTime(tasks: GitHubIssue[]) {
  return tasks.sort((a, b) => {
    const aTimeValue = a.labels.reduce((acc, label) => acc + (typeof label === "object" && label?.name ? calculateTimeLabelValue(label.name) : 0), 0);
    const bTimeValue = b.labels.reduce((acc, label) => acc + (typeof label === "object" && label?.name ? calculateTimeLabelValue(label.name) : 0), 0);
    return bTimeValue - aTimeValue;
  });
}
