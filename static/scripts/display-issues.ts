import { GitHubIssue } from "../github-types";

export function displayIssues(container: HTMLDivElement, issues: GitHubIssue[]) {
  container.innerHTML = "";
  let delay = 0;
  const baseDelay = 125; // Base delay in milliseconds

  issues.forEach((issue, index) => {
    const issueWrapper = document.createElement("div");
    const issueElement = document.createElement("div");
    issueWrapper.classList.add("issue-element-wrapper");
    issueElement.classList.add("issue-element-inner");
    issueWrapper.classList.add("issue-fade-in");

    // Calculate the delay using an approximation of the cubic-bezier(0,1,1,1) easing function
    delay = baseDelay * ((index * index) / (issues.length - 1));

    issueElement.style.animationDelay = `${delay}ms`;

    // Parse organization name and repository name from the issue's URL

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const mirrorUrls = issue.body.match(urlRegex);

    const urlPattern = /https:\/\/github\.com\/([^/]+)\/([^/]+)\//;
    const match = mirrorUrls?.shift()?.match(urlPattern);
    const organizationName = match?.[1];
    const repositoryName = match?.[2];

    issueElement.innerHTML = `
        <h3>${issue.title}</h3>
        <p class="organization-name">${organizationName}</p>
        <p class="repository-name">${repositoryName}</p>
      `;

    issueElement.addEventListener("click", () => {
      console.log(issue);

      //   console.log(foundUrls);
      //   window.open(foundUrls?.shift(), "_blank");
    });

    issueWrapper.appendChild(issueElement);

    // Append the issue element after the delay
    setTimeout(() => {
      container.appendChild(issueWrapper);
      // Trigger the animation by adding the 'visible' class
      issueElement.classList.add("visible");
    }, delay);
  });
}
