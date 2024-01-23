import { SortingManager } from "./sorting-manager";

export const SORTING_OPTIONS = ["price", "time", "priority", "activity"] as const;
export type Sorting = (typeof SORTING_OPTIONS)[number];

export function generateSortingToolbar() {
  const sortingManager = new SortingManager("filters", SORTING_OPTIONS);
  sortingManager.render();
}
