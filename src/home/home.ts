import { grid } from "../the-grid";
import { authentication } from "./authentication";
import { fetchAndDisplayPreviews } from "./fetch-github/fetch-and-display-previews";
import { fetchIssuesFull } from "./fetch-github/fetch-issues-full";
import { generateSortingButtons } from "./sorting/generate-sorting-buttons";

generateSortingButtons();
grid(document.getElementById("grid") as HTMLElement);

renderServiceMessage();

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

function renderServiceMessage() {
  const urlParams = new URLSearchParams(window.location.search);
  const message = urlParams.get("message");
  if (message) {
    const serviceMessageContainer = document.querySelector("#service-message > div");
    if (serviceMessageContainer) {
      serviceMessageContainer.textContent = message;
      serviceMessageContainer.parentElement?.classList.add("ready");
    }
  }
}
