import { grid } from "../the-grid";
import { authentication } from "./authentication";
import { fetchGitHubIssues } from "./fetch-github-issues";
import { sortingButtons } from "./sorting-buttons";

fetchGitHubIssues().catch((error) => console.error(error));
authentication();
sortingButtons();
grid(document.getElementById("grid") as HTMLElement);
