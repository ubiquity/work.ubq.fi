import { fetchAndDisplayPreviewsFromCache } from "../fetch-github/fetch-and-display-previews";
import { taskManager } from "../home";
import { Sorting } from "./generate-sorting-buttons";

export class SortingManager {
  private _lastChecked: HTMLInputElement | null = null;
  private _toolBarFilters: HTMLElement;
  private _filterTextBox: HTMLInputElement;
  private _sortingButtons: HTMLElement;

  constructor(filtersId: string, sortingOptions: readonly string[]) {
    const filters = document.getElementById(filtersId);
    if (!filters) throw new Error(`${filtersId} not found`);
    this._toolBarFilters = filters;
    this._filterTextBox = this._generateFilterTextBox();
    this._sortingButtons = this._generateSortingButtons(sortingOptions);
  }

  public render() {
    this._toolBarFilters.appendChild(this._sortingButtons);
    this._toolBarFilters.appendChild(this._filterTextBox);
  }

  private _generateFilterTextBox() {
    const textBox = document.createElement("input");
    textBox.type = "text";
    textBox.id = "filter";
    textBox.placeholder = "Text Filter";

    const issuesContainer = document.getElementById("issues-container") as HTMLDivElement;
    textBox.addEventListener("input", () => {
      const filterText = textBox.value.toLowerCase();
      const issues = Array.from(issuesContainer.children) as HTMLDivElement[];
      issues.forEach((issue) => {
        const issuePreviewId = issue.children[0].getAttribute("data-preview-id");
        if (!issuePreviewId) throw new Error(`No preview id found for issue ${issue}`);
        const fullIssue = taskManager.getTaskByPreviewId(Number(issuePreviewId)).full;
        if (!fullIssue) throw new Error(`No full issue found for preview id ${issuePreviewId}`);
        const searchableProperties = ["title", "body", "number", "html_url"] as const;
        const searchableStrings = searchableProperties.map((prop) => fullIssue[prop]?.toString().toLowerCase());
        const isVisible = searchableStrings.some((str) => str.includes(filterText));
        issue.style.display = isVisible ? "block" : "none";
      });
    });

    return textBox;
  }

  private _generateSortingButtons(sortingOptions: readonly string[]) {
    const buttons = document.createElement("div");
    buttons.className = "labels";

    sortingOptions.forEach((option) => {
      const input = this._createRadioButton(option);
      const label = this._createLabel(option);

      buttons.appendChild(input);
      buttons.appendChild(label);

      input.addEventListener("click", () => this._handleSortingClick(input, option));
    });

    return buttons;
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

  private async _handleSortingClick(input: HTMLInputElement, option: string) {
    const ordering = input === this._lastChecked ? "reverse" : "normal";
    input.checked = input !== this._lastChecked;
    input.setAttribute("data-ordering", ordering);
    this._lastChecked = input.checked ? input : null;
    this._filterTextBox.value = "";
    input.parentElement?.childNodes.forEach((node) => {
      if (node instanceof HTMLInputElement) {
        node.setAttribute("data-ordering", "");
      }
    });

    input.setAttribute("data-ordering", ordering);
    // instantly load from cache
    fetchAndDisplayPreviewsFromCache(option as Sorting, { ordering }).catch((error) => console.error(error));

    // load from network in the background
    // const fetchedPreviews = await fetchIssuePreviews();
    // const cachedTasks = taskManager.getTasks();
    // const updatedCachedIssues = verifyGitHubIssueState(cachedTasks, fetchedPreviews);
    // displayGitHubIssues(sorting, options);
    // taskManager.syncTasks(updatedCachedIssues);
    // return fetchAvatars();
  }
}
