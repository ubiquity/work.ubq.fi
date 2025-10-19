import { GitHubIssue, GitHubLabel } from "../github-types.ts";
import { getLabelText } from "./label-utils.ts";

export function sortIssuesByPrice(issues: GitHubIssue[]) {
  return issues.sort((a, b) => {
    const aPrice = a.labels.map(getPriceFromLabel).find((price) => price !== null) ?? -1;
    const bPrice = b.labels.map(getPriceFromLabel).find((price) => price !== null) ?? -1;

    return bPrice - aPrice;
  });
}

function getPriceFromLabel(label: GitHubLabel) {
  const text = getLabelText(label);
  if (!text) return null;
  const match = text.match(/^(Price:)\s*([\d,]+)/);
  return match ? parseInt(match[2].replace(/,/g, ""), 10) : null;
}
