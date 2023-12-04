import { authentication } from "./authentication";
import { Sorting, fetchGitHubIssues } from "./fetch-github-issues";

fetchGitHubIssues().catch((error) => console.error(error));
authentication();
filterButtons();

function filterButtons() {
  const filters = document.getElementById("filters");
  if (!filters) throw new Error("filters not found");
  const buttons = filters.querySelectorAll("input");

  buttons.forEach((button) => {
    let isChecked = button.checked;
    button.addEventListener("mousedown", () => {
      isChecked = button.checked;
    });
    button.addEventListener("click", () => {
      if (isChecked) {
        button.checked = false;
        fetchGitHubIssues().catch((error) => console.error(error));
      } else {
        fetchGitHubIssues(button.value as Sorting).catch((error) => console.error(error));
      }
      // Update the flag to the current state for the next click
      isChecked = button.checked;
    });
  });
}
