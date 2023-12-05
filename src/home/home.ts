import { grid } from "../the-grid";
import { authentication } from "./authentication";
import { fetchAndDisplayIssuesCacheOrRemote } from "./fetch-github/fetch-display-cached-remote-issues";
import { fetchIssuesFull } from "./fetch-github/fetch-issues-full";
import { generateSortingButtons } from "./sorting/generate-sorting-buttons";

generateSortingButtons();
grid(document.getElementById("grid") as HTMLElement);

authentication().catch((error) => console.error(error));

fetchAndDisplayIssuesCacheOrRemote()
  .then((downloaded) => {
    localStorage.setItem("gitHubIssues", JSON.stringify(downloaded));
    console.log(downloaded);
    return downloaded;
  })
  .then((downloaded) => {
    const toolbar = document.getElementById("toolbar");
    if (!toolbar) throw new Error("toolbar not found");
    toolbar.classList.add("ready");
    return downloaded;
  })
  .then(fetchIssuesFull)
  .then((downloaded) => {
    localStorage.setItem("gitHubIssuesFull", JSON.stringify(downloaded));
    console.log(downloaded);
    return downloaded;
  })
  .catch((error) => console.error(error));
