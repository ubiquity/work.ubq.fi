import { TaskMaybeFull } from "../fetch-github/preview-to-full-mapping";

export function sortIssuesByPrice(issues: TaskMaybeFull[]) {
  return issues.sort((a, b) => {
    const aPriceLabel = a.preview.labels.find((label) => label.name.startsWith("Pricing: "));
    const bPriceLabel = b.preview.labels.find((label) => label.name.startsWith("Pricing: "));

    const aPriceMatch = aPriceLabel ? aPriceLabel.name.match(/Pricing: (\d+)/) : null;
    const bPriceMatch = bPriceLabel ? bPriceLabel.name.match(/Pricing: (\d+)/) : null;

    const aPrice = aPriceMatch && aPriceMatch[1] ? parseInt(aPriceMatch[1], 10) : 0;
    const bPrice = bPriceMatch && bPriceMatch[1] ? parseInt(bPriceMatch[1], 10) : 0;

    return bPrice - aPrice;
  });
}
