declare const IS_RFC: boolean;
import { SortingManager } from "./sorting-manager";

export const SORTING_OPTIONS = IS_RFC ? ["time", "priority", "activity"] : ["price", "time", "priority", "activity"] as const;
export type Sorting = (typeof SORTING_OPTIONS)[number];

export function generateSortingToolbar() {
  const sortingManagerTop = new SortingManager("filters", SORTING_OPTIONS, "top");
  sortingManagerTop.render();

  const sortingManagerBottom = new SortingManager("filters-bottom", SORTING_OPTIONS, "bottom");
  sortingManagerBottom.render();
}
