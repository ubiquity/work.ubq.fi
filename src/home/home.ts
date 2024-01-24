import { grid } from "../the-grid";
import { authentication } from "./authentication";
import { fetchAndDisplayPreviews } from "./fetch-github/fetch-and-display-previews";
import { fetchIssuesFull } from "./fetch-github/fetch-issues-full";
import { generateSortingToolbar } from "./sorting/generate-sorting-buttons";
import { GitHubIssue } from "./github-types";

generateSortingToolbar();
grid(document.getElementById("grid") as HTMLElement);

authentication()
  .then(fetchAndDisplayPreviews)
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
