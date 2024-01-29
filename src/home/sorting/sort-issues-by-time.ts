import { TaskMaybeFull } from "../fetch-github/preview-to-full-mapping";
import { calculateTimeLabelValue } from "./calculate-time-label-value";

export function sortIssuesByTime(tasks: TaskMaybeFull[]) {
  return tasks.sort((a, b) => {
    const aTimeValue = a.preview.labels.reduce((acc, label) => acc + calculateTimeLabelValue(label.name), 0);
    const bTimeValue = b.preview.labels.reduce((acc, label) => acc + calculateTimeLabelValue(label.name), 0);
    return bTimeValue - aTimeValue;
  });
}
