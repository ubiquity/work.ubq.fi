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
    button.addEventListener("click", () => {
      fetchGitHubIssues(button.value as Sorting).catch((error) => console.error(error));
    });
  });
}
