import { GitHubIssue } from "./github-types";

export async function mainModule() {
  await fetchIssues();

  async function fetchIssues() {
    const container = document.getElementById('issues-container');
    if (!container) {
      throw new Error('Could not find issues container');
    }
    container.innerHTML = '<p>Loading issues...</p>';

    try {
      const cachedIssues = localStorage.getItem('githubIssues');
      let issues;

      if (cachedIssues) {
        issues = JSON.parse(cachedIssues);
      } else {
        const response = await fetch('https://api.github.com/repos/ubiquity/devpool-directory/issues');
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        issues = await response.json();
        localStorage.setItem('githubIssues', JSON.stringify(issues));
      }

      const sortedIssues = sortIssuesByComments(issues);
      displayIssues(sortedIssues);
    } catch (error) {
      container.innerHTML = `<p>Error loading issues: ${error}</p>`;
    }
  }

  function displayIssues(issues: GitHubIssue[]) {
    const container = document.getElementById("issues-container");
    issues.forEach((issue) => {
      const issueElement = document.createElement("div");
      issueElement.innerHTML = `
            <h3>${issue.title}</h3>
            <p>${issue.body}</p>
        `;
      container?.appendChild(issueElement);
    });
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
mainModule()
  .then(() => {
    console.log("mainModule loaded");
  })
  .catch((error) => {
    // Handle any errors
    console.error(error);
  });
