import { GitHubIssue } from "../github-types";

export function sortIssuesByPrice(issues: GitHubIssue[]) {
  return issues.sort((a, b) => {
    const aPrice = a.labels.map(getPriceFromLabel).find((price) => price !== null) ?? -1;
    const bPrice = b.labels.map(getPriceFromLabel).find((price) => price !== null) ?? -1;

    return bPrice - aPrice;
  });
}

function getPriceFromLabel(label: string | { name?: string }) {
  const text = typeof label === "string" ? label : label?.name || "";
  if (!text) return null;
  const match = text.match(/^(Price:|Pricing:)\s*([\d,]+)/);
  return match ? parseInt(match[2].replace(/,/g, ""), 10) : null;
}
