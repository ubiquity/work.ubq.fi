import { fetchAndDisplayPreviews } from "../fetch-github/fetch-and-display-previews";
import { Sorting } from "./generate-sorting-buttons";

export class SortingManager {
  private _lastChecked: HTMLInputElement | null = null;
  private _filters: HTMLElement;

  constructor(filtersId: string) {
    const filters = document.getElementById(filtersId);
    if (!filters) throw new Error(`${filtersId} not found`);
    this._filters = filters;
  }

  public generateSortingButtons(sortingOptions: readonly string[]) {
    const labels = document.createElement("div");
    labels.className = "labels";

    sortingOptions.forEach((option) => {
      const input = this._createRadioButton(option);
      const label = this._createLabel(option);

      labels.appendChild(input);
      labels.appendChild(label);

      input.addEventListener("click", () => {
        this._handleSortingClick(input, option);
      });
    });

    this._filters.appendChild(labels);
  }

  private _createRadioButton(option: string): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "radio";
    input.value = option;
    input.id = option;
    input.name = "sort";
    return input;
  }

  private _createLabel(option: string): HTMLLabelElement {
    const label = document.createElement("label");
    label.htmlFor = option;
    label.textContent = option.charAt(0).toUpperCase() + option.slice(1);
    return label;
  }

  private _handleSortingClick(input: HTMLInputElement, option: string) {
    const ordering = input === this._lastChecked ? "reverse" : "normal";
    input.checked = input !== this._lastChecked;
    input.setAttribute("data-ordering", ordering);
    this._lastChecked = input.checked ? input : null;

    fetchAndDisplayPreviews(option as Sorting, { ordering }).catch((error) => console.error(error));
  }
}
