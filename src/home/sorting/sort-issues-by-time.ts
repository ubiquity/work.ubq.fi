import { GitHubIssue } from "../github-types";
import { calculateTimeLabelValue } from "./calculate-time-label-value";

export function sortIssuesByTime(issues: GitHubIssue[]) {
  return issues.sort((a, b) => {
    const aTimeValue = a.labels.reduce((acc, label) => acc + calculateTimeLabelValue(label.name), 0);
    const bTimeValue = b.labels.reduce((acc, label) => acc + calculateTimeLabelValue(label.name), 0);
    return bTimeValue - aTimeValue;
  });
}
