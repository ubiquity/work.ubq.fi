import { grid } from "../the-grid";
import { authentication } from "./authentication";
import { fetchAndDisplayPreviewsFromCache } from "./fetch-github/fetch-and-display-previews";
import { fetchIssuesFull } from "./fetch-github/fetch-issues-full";
import { GitHubIssue } from "./github-types";
import { generateSortingToolbar } from "./sorting/generate-sorting-buttons";

generateSortingToolbar();
grid(document.getElementById("grid") as HTMLElement);

authentication()
  .then(fetchAndDisplayPreviewsFromCache)
  .then((previews) => readyToolbar(previews))
  .then((previews) => fetchIssuesFull(previews))
  .then((promises) => Promise.allSettled(promises))
  .catch((error) => console.error(error));

async function readyToolbar(previews: GitHubIssue[]) {
  const toolbar = document.getElementById("toolbar");
  if (!toolbar) throw new Error("toolbar not found");
  toolbar.classList.add("ready");
  return previews;
}
