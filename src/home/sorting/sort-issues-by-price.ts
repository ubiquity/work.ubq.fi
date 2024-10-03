import { GitHubIssue } from "../github-types";

export function sortIssuesByPrice(issues: GitHubIssue[]) {
  return issues.sort((a, b) => {
    const aPrice = a.labels.map(getPriceFromLabel).find((price) => price !== null) ?? -1;
    const bPrice = b.labels.map(getPriceFromLabel).find((price) => price !== null) ?? -1;

    return bPrice - aPrice;
  });
}

function getPriceFromLabel(label: string | { name?: string }) {
  if (typeof label === "string" || !label.name) return null;
  if (label.name.startsWith("Price: ")) {
    const match = label.name.match(/Price: (\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
  return null;
}
