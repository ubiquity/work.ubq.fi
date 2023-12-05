import { grid } from "../the-grid";
import { authentication } from "./authentication";
import { fetchCachedPreviews, fetchGitHubIssues, fetchIssuesFull } from "./fetch-github-issues";
import { sortingButtons } from "./sorting-buttons";

fetchGitHubIssues().catch((error) => console.error(error));
authentication();
sortingButtons();
grid(document.getElementById("grid") as HTMLElement);

const cachedPreviews = fetchCachedPreviews();

if (cachedPreviews) {
  fetchIssuesFull(cachedPreviews)
    .then((downloaded) => {
      localStorage.setItem("gitHubIssuesFull", JSON.stringify(downloaded));
      return downloaded;
    })
    .then((downloaded) => console.log(downloaded))
    .catch((error) => console.error(error));
}

export function fetchCachedIssuesFull() {
  const cachedIssues = localStorage.getItem("gitHubIssuesFull");
  if (cachedIssues) {
    try {
      return JSON.parse(cachedIssues);
    } catch (error) {
      console.error(error);
    }
  }
  return null;
}
