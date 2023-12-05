import { grid } from "../the-grid";
import { authentication } from "./authentication";
import { fetchAndDisplayPreviews } from "./fetch-github/fetch-and-display-previews";
import { fetchIssuesFull } from "./fetch-github/fetch-issues-full";
import { generateSortingButtons } from "./sorting/generate-sorting-buttons";

generateSortingButtons();
grid(document.getElementById("grid") as HTMLElement);

authentication()
  .then(fetchAndDisplayPreviews)
  .then((previews) => {
    localStorage.setItem("gitHubIssuesPreviews", JSON.stringify(previews));
    const toolbar = document.getElementById("toolbar");
    if (!toolbar) throw new Error("toolbar not found");
    toolbar.classList.add("ready");
    return previews;
  })
  .then(fetchIssuesFull)
  .catch((error) => console.error(error));
