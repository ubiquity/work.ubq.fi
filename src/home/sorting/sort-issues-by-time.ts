import { GitHubIssue } from "../github-types";
import { calculateTimeLabelValue } from "./calculate-time-label-value";

export function sortIssuesByTime(tasks: GitHubIssue[]) {
  return tasks.sort((a, b) => {
    const aTimeValue = a.labels.reduce((acc, label) => {
      const text = typeof label === "string" ? label : label?.name || "";
      return acc + (text.startsWith("Time: ") ? calculateTimeLabelValue(text) : 0);
    }, 0);
    const bTimeValue = b.labels.reduce((acc, label) => {
      const text = typeof label === "string" ? label : label?.name || "";
      return acc + (text.startsWith("Time: ") ? calculateTimeLabelValue(text) : 0);
    }, 0);
    return bTimeValue - aTimeValue;
  });
}
