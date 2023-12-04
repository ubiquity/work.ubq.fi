import { SORTING_OPTIONS, Sorting, fetchGitHubIssues } from "./fetch-github-issues";

export function sortingButtons() {
  const filters = document.getElementById("filters");
  if (!filters) throw new Error("filters not found");

  const labels = document.createElement("div");
  labels.className = "labels";

  let lastChecked: HTMLInputElement | null = null;

  SORTING_OPTIONS.forEach((option) => {
    const dfg = document.createDocumentFragment();
    const div = document.createElement("div");
    const label = document.createElement("label") as HTMLLabelElement;
    const input = document.createElement("input");
    input.type = "radio";
    input.value = option;
    input.id = option;
    input.name = "sort";

    const defaultIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"/></svg>`;
    const activeIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-200 240-440l56-56 184 183 184-183 56 56-240 240Zm0-240L240-680l56-56 184 183 184-183 56 56-240 240Z"/></svg>`;

    label.htmlFor = option;
    div.className = "default icon";
    div.innerHTML = defaultIcon;
    const divActive = div.cloneNode(true) as HTMLDivElement;
    divActive.className = "active icon";
    divActive.innerHTML = activeIcon;
    label.appendChild(div);
    label.appendChild(divActive);
    label.appendChild(document.createTextNode(option.charAt(0).toUpperCase() + option.slice(1)));
    dfg.appendChild(input);
    dfg.appendChild(label);
    labels.appendChild(dfg);

    input.addEventListener("click", () => {
      if (input === lastChecked) {
        input.checked = false;
        lastChecked = null;
        fetchGitHubIssues().catch((error) => console.error(error));
      } else {
        lastChecked = input;
        fetchGitHubIssues(input.value as Sorting).catch((error) => console.error(error));
      }
    });
  });
  filters.appendChild(labels);
}
