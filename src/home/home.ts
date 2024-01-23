import { grid } from "../the-grid";
import { authentication } from "./authentication";
import { fetchAndDisplayPreviews } from "./fetch-github/fetch-and-display-previews";
import { fetchIssuesFull } from "./fetch-github/fetch-issues-full";
import { generateSortingToolbar } from "./sorting/generate-sorting-buttons";

generateSortingToolbar();
grid(document.getElementById("grid") as HTMLElement);

authentication()
  .then(fetchAndDisplayPreviews)
  .then((previews) => {
    localStorage.setItem("gitHubIssuesPreview", JSON.stringify(previews));
    const toolbar = document.getElementById("toolbar");
    if (!toolbar) throw new Error("toolbar not found");
    toolbar.classList.add("ready");
    return previews;
  })
  .then(fetchIssuesFull)
  .then((promises) => {
    return Promise.allSettled(promises);
  })
  .then((results) => {
    console.trace({ results });
  })
  .catch((error) => console.error(error));
