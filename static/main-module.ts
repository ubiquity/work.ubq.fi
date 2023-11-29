import { Octokit } from "@octokit/rest";
import { GitHubIssue } from "./github-types";
import { displayIssues } from "./scripts/display-issues";

export async function mainModule() {
  const container = document.getElementById("issues-container") as HTMLDivElement;
  if (!container) {
    throw new Error("Could not find issues container");
  }
  await fetchIssues();

  async function fetchIssues() {
    try {
      const cachedIssues = localStorage.getItem("githubIssues");

      if (cachedIssues) {
        try {
          const issues = JSON.parse(cachedIssues);
          const sortedIssues = sortIssuesByComments(issues);
          displayIssues(container, sortedIssues);
        } catch (error) {
          console.error(error);
        }
      }

      const octokit = new Octokit();

      const freshIssues = (await octokit.paginate("GET /repos/ubiquity/devpool-directory/issues")) as GitHubIssue[];
      localStorage.setItem("githubIssues", JSON.stringify(freshIssues));
      const sortedIssues = sortIssuesByComments(freshIssues);
      displayIssues(container, sortedIssues);
    } catch (error) {
      container.innerHTML = `<p>Error loading issues: ${error}</p>`;
    }
  }

  function sortIssuesByComments(issues: GitHubIssue[]) {
    return issues.sort((a, b) => {
      if (a.comments > b.comments) {
        return -1;
      }
      if (a.comments < b.comments) {
        return 1;
      }
      return 0;
    });
  }
}
