import { SortingManager } from "./sorting-manager";

export const SORTING_OPTIONS = ["price", "time", "priority"] as const;
export type Sorting = (typeof SORTING_OPTIONS)[number];

export function generateSortingButtons() {
  const sortingManager = new SortingManager("filters");
  sortingManager.generateSortingButtons(SORTING_OPTIONS);
}
