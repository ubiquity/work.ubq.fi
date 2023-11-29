export async function mainModule() {
  await fetchIssues();

  async function fetchIssues() {
    function sortIssuesByComments(issues: any[]) {
      return issues.sort((a, b) => b.comments - a.comments);
    }
    const container = document.getElementById("issues-container");
    if (!container) {
      throw new Error("No issues container found");
    }

    container.innerHTML = "<p>Loading issues...</p>";

    try {
      const response = await fetch("https://api.github.com/repos/ubiquity/devpool-directory/issues");
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const issues = await response.json();
      const sortedIssues = sortIssuesByComments(issues);
      displayIssues(sortedIssues);
    } catch (error) {
      container.innerHTML = `<p>Error loading issues: ${error}</p>`;
    }
  }

  function displayIssues(issues: any[]) {
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
}
mainModule()
  .then(() => {
    console.log("mainModule loaded");
  })
  .catch((error) => {
    // Handle any errors
    console.error(error);
  });
