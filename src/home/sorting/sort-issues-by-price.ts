// @ts-nocheck

import { GitHubIssue } from "../github-types";

export function sortIssuesByPrice(issues: GitHubIssue[]) {
  return issues.sort((a, b) => {
    const aPriceLabel = a.labels.find((label) => label.name.startsWith("Price: "));
    const bPriceLabel = b.labels.find((label) => label.name.startsWith("Price: "));

    const aPriceMatch = aPriceLabel ? aPriceLabel.name.match(/Price: (\d+)/) : null;
    const bPriceMatch = bPriceLabel ? bPriceLabel.name.match(/Price: (\d+)/) : null;

    const aPrice = aPriceMatch && aPriceMatch[1] ? parseInt(aPriceMatch[1], 10) : 0;
    const bPrice = bPriceMatch && bPriceMatch[1] ? parseInt(bPriceMatch[1], 10) : 0;

    return bPrice - aPrice;
  });
}
