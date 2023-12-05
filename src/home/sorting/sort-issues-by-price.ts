import { GitHubIssue } from "../github-types";

export function sortIssuesByPrice(issues: GitHubIssue[]) {
  return issues.sort((a, b) => {
    const aPriceLabel = a.labels.find((label) => label.name.startsWith("Pricing: "));
    const bPriceLabel = b.labels.find((label) => label.name.startsWith("Pricing: "));
    const aPrice = aPriceLabel ? parseInt(aPriceLabel.name.match(/Pricing: (\d+)/)![1], 10) : 0;
    const bPrice = bPriceLabel ? parseInt(bPriceLabel.name.match(/Pricing: (\d+)/)![1], 10) : 0;
    return bPrice - aPrice;
  });
}
